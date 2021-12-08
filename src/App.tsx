import React, {useEffect, useState} from 'react';
import './App.css';
import Amplify from 'aws-amplify';
import Fuse from 'fuse.js';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useRouteMatch,
    useParams
} from "react-router-dom";
import { withAuth } from './lib/WithAuth';
import { ListFiles, GetSignedUrl } from './lib/BB2';
import awsconfig from './aws-config';

Amplify.configure(awsconfig);

let allFiles = [];
let fuse;

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { files: [], };
        this.setFiles = this.setFiles.bind(this)
    }

    setFiles(files) {
        this.setState({files:files});
    }

    componentDidMount() {
      ListFiles().then(files => {
          allFiles = files;
          this.setState({files:allFiles});
          fuse = new Fuse(allFiles, {keys: [], threshold: 0.4, ignoreLocation: true, useExtendedSearch: true})
          console.log(allFiles);
      });
    }



    render() {
        return (
            <Router>
                <div>
                    <Switch>
                        <Route path={`/:fileKey+`}>
                            <File />
                        </Route>
                        <Route path="/">
                            <SearchBar setFiles={this.setFiles}/>
                            <ul>
                                {this.state.files.map(item => (
                                    <li key={item}>
                                        <Link to={`/${encodeURI(item)}`}>{item}</Link>
                                    </li>
                                ))}
                            </ul>
                        </Route>
                    </Switch>
                </div>
            </Router>
        );
    }
}

function File() {
    let { fileKey } = useParams();
    const [url, updateUrl] = useState();
    useEffect(() => {
        GetSignedUrl(fileKey).then(res => updateUrl(res.presignedUrl));
    });
    return <>{url &&  <video src={`${url}`} controls={true} autoPlay={true} />}</>;
}

function SearchBar({setFiles}) {
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.value.length > 0) {
            setFiles(fuse.search(e.target.value).map(x => x.item));
        }
    };

    return <div>
        <input
            type="search"
            placeholder="Search here"
            onChange={handleChange} />
    </div>
}

export default withAuth(App);

