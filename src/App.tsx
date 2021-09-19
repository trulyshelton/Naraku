import React, {useEffect, useState} from 'react';
import './App.css';
import Amplify from 'aws-amplify';
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

class App extends React.Component<any, any> {
    state = {
        files: [],
    };

    componentDidMount() {
      ListFiles().then(files => {
          console.log(files)
          this.setState({files})
      });
    }

    render() {
        const files = this.state.files;
        return (
            <Router>
                <div>
                    <Switch>
                        <Route path={`/:fileKey+`}>
                            <File />
                        </Route>
                        <Route path="/">
                            <ul>
                                {files.map(item => (
                                    <li>
                                        <Link to={`/${encodeURI(item['Key'])}`}>{item['Key']}</Link>
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
        const getData = async () => {
            let result = await GetSignedUrl(fileKey);
            updateUrl(result.presignedUrl);
        }
        getData();
    });
    return <>{url &&  <video src={`${url}`} controls={true} autoPlay={true} />}</>;
}

export default withAuth(App);

