const awsconfig =  {
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
};


export default awsconfig;