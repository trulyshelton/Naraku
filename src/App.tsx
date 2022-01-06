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
import { ListFiles, GetSignedUrl } from './lib/BB2';
import awsconfig from './aws-config';

Amplify.configure(awsconfig);

let allFiles = JSON.parse(localStorage.getItem("allFiles") || '[]');
let fuse;

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { files: allFiles, };
        this.setFiles = this.setFiles.bind(this)
    }

    setFiles(files) {
        this.setState({files:files});
    }

    componentDidMount() {
      ListFiles().then(files => {
          allFiles = files;
          localStorage.setItem("allFiles", JSON.stringify(allFiles))
          this.setFiles(allFiles);
          fuse = new Fuse(allFiles, {keys: [], threshold: 0.4, ignoreLocation: true, useExtendedSearch: true})
          console.log("Load all files complete.");
      });
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
                            <SearchBar setFiles={this.setFiles}/>
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
    console.log(`Exploring path ${path}.`);

    let root = path === undefined ? "" : "/";
    path = path || "";

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
    const [url, updateUrl] = useState();
    useEffect(() => {GetSignedUrl(fileKey).then(res => updateUrl(res.presignedUrl));});
    return <div>
        <p style={{textAlign:"center"}}>{fileKey.split("/").pop()}</p>
        {url &&  <video className={"center"} src={`${url}`} controls={true} autoPlay={true} />}
    </div>;
}

function SearchBar({setFiles}) {
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.value.length > 0) {
            setFiles(fuse.search(e.target.value).map(x => x.item));
        } else {
            setFiles(allFiles)
        }
    };

    return <div>
        <textarea
            className={"center"}
            placeholder="Search here"
            onChange={handleChange} />
    </div>
}

export default withAuth(App);

