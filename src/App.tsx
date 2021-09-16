import React from 'react';
import logo from './logo.svg';
import './App.css';
import Amplify, { Auth, Storage } from 'aws-amplify';
import { withAuth } from './lib/WithAuth';

Amplify.configure({
  Auth: {
    identityPoolId: 'us-west-2:6be02c25-8ed1-41c3-be24-91fd359ae1ae', //REQUIRED - Amazon Cognito Identity Pool ID
    region: 'us-west-2', // REQUIRED - Amazon Cognito Region
    userPoolId: 'us-west-2_igXUlSWIY', //OPTIONAL - Amazon Cognito User Pool ID
    userPoolWebClientId: '353nnho6ujdajmsko93qqftgr9', //OPTIONAL - Amazon Cognito Web Client ID
  },
  Storage: {
    customPrefix: {
      public: '',
    },
    AWSS3: {
      bucket: 'naraku', //REQUIRED -  Amazon S3 bucket name
      region: 'us-west-2', //OPTIONAL -  Amazon service region
    }
  }
});

class App extends React.Component<any, any> {

  componentDidMount() {
    Storage.list('') // for listing ALL files without prefix, pass '' instead
        .then(result => console.log(result))
        .catch(err => console.log(err));
    // Storage.get("")
    //     .then(result => console.log(result))
    //     .catch(err => console.log(err));

  }

  render() {
    return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo"/>
            <p>
              Edit <code>src/App.tsx</code> and save to reload.
            </p>
            <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
              Learn React
            </a>
          </header>
        </div>
    );
  }
}

export default withAuth(App);

