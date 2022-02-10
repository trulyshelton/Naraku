import React, {useEffect, useState} from 'react';
import './App.css';
import Amplify from 'aws-amplify';
import Fuse from 'fuse.js';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";
import { withAuth } from './lib/WithAuth';
import {PaginateListFiles, GetSignedUrl, GetConfigAndInit, DeleteFile} from './lib/BB2';
import awsconfig from './aws-config';
import {BuildTreeFromPaths} from "./lib/Utils";

Amplify.configure(awsconfig);

let allFiles : string[] = JSON.parse(localStorage.getItem("allFiles") || '[]');
let fuse = new Fuse(allFiles, {keys: [], threshold: 0.4, ignoreLocation: true, useExtendedSearch: true});

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {files: allFiles};
        this.setFiles = this.setFiles.bind(this)
    }

    setFiles(files) {
        this.setState({files:files});
    }

    componentDidMount() {
        GetConfigAndInit().then(() => {
            let localAllFiles : string[] = [];
            PaginateListFiles("").then(async paginator => {
                for await (const data of paginator) {
                    localAllFiles.push(...(data.Contents!.map(x => x.Key as string)));
                }
                let tree = BuildTreeFromPaths(localAllFiles);
                console.log(tree);
                allFiles = localAllFiles;
                this.setFiles(allFiles);
                fuse = new Fuse(allFiles, {keys: [], threshold: 0.4, ignoreLocation: true, useExtendedSearch: true})
                localStorage.setItem("allFiles", JSON.stringify(allFiles))
                console.log("Load all files complete.");
                this.setState({...this.state, loaded: true});
            }).catch(err => {
                console.error(err);
                this.setState({error: err});
            });
        }).catch(err => {
            console.error(err);
            this.setState({error: err});
        })
    }


    render() {
        return (
            <Router>
                <div>
                    <Switch>
                        <Route path={`/:fileKey+/view`}>
                            <File />
                        </Route>
                        <Route path="/:path*">
                            <SearchBar setFiles={this.setFiles} state={this.state}/>
                            <Explorer state={this.state}/>
                        </Route>
                    </Switch>
                </div>
            </Router>
        );
    }
}

function Explorer({state}) {
    let { path } = useParams();

    let root = path === undefined ? "" : "/";
    path = path || "";
    console.log(`Exploring path ${path}`);

    let folderSet = new Set(), topLevelFiles: string[] = [];
    for (let i = 0; i < state.files.length; i++) {
        let file = state.files[i]
        if (file.startsWith(path)) {
            file = file.substring(path.length);
            file = file.startsWith("/") ? file.substring(1) : file;
            let splits = file.split("/");
            if (splits.length > 1) {
                folderSet.add(splits[0])
            } else {
                topLevelFiles.push(file);
            }
        }
    }

    return (
        <ul>
            {path && <li key={".."}>
                <Link to={"../"}>../</Link>
            </li>}
            {(Array.from(folderSet) as string[]).map(folder => (
                <li key={folder}>
                    <Link to={`${root + encodeURI(path + "/" + folder)}/`}>{folder}/</Link>
                </li>
            ))}
            {topLevelFiles.map(item => (
                <li key={item}>
                    <Link to={`${root + encodeURI(path + "/" + item)}/view`}>{item}</Link>
                </li>
            ))}
        </ul>
    );
}

function File() {
    let { fileKey } = useParams();
    const [url, updateUrl] = useState("");
    useEffect(() => {GetSignedUrl(fileKey).then(res => updateUrl(res));});
    let deleteOnClick = () => {
        let confirm = window.confirm(`Are you sure to delete file ${fileKey}?`);
        if (confirm) {
            DeleteFile(fileKey)
                .then(() => {
                    alert(`deleted ${fileKey}`);
                // ToDo: reload allFiles
                })
                .catch(alert);
        }
    }
    return <div>
        <p style={{textAlign:"center"}}>{(fileKey).split("/").pop()} <span onClick={deleteOnClick}>❌</span></p>

        {url &&  <video className={"center"} src={`${url}`} controls={true} autoPlay={true} />}
    </div>;
}

function SearchBar({setFiles, state}) {
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.value.length > 0) {
            setFiles(fuse.search(e.target.value).map(x => x.item));
        } else {
            setFiles(allFiles)
        }
    };

    let placeholderText = "Loading...";
    if (state.loaded) placeholderText = "Search here";
    if (state.error) placeholderText = state.error.toString();
    return <div>
        <textarea
            className={"center"}
            placeholder={placeholderText}
            onChange={handleChange} />
    </div>
}

export default withAuth(App);

