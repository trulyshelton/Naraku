import React, {useEffect, useState} from 'react';
import './App.css';
import Amplify from 'aws-amplify';
import Fuse from 'fuse.js';
import { useDebounce } from 'use-debounce';
import {
    BrowserRouter as Router,
    Route,
    Routes,
    useParams
} from "react-router-dom";
import { withAuth } from './lib/WithAuth';
import {GetSignedUrl, DeleteFile, GetAllFiles} from './lib/BB2';
import awsconfig from './aws-config';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem  from '@mui/lab/TreeItem';
import {BuildTreeFromObjects} from "./lib/Utils";
import {Box, TextField, Link} from "@mui/material";

Amplify.configure(awsconfig);
var allFiles = [];

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Router>
                <Routes>
                    <Route path="/" element={<Explorer/>} />
                    <Route path="/view/*" element={<File/>} />
                </Routes>
            </Router>
        );
    }
}

function File() {
    let fileKey = useParams()['*']!;
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

class Explorer extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        try {
            allFiles = (await GetAllFiles(""));
            this.setState({search: ''});
            console.log("Load all files complete.");
        } catch (err) {
            console.error(err);
            this.setState({...this.state, error: err});
        }
    }

    render() {
        let results = this.state.search ?
            new Fuse(allFiles, {keys: ['Key'], threshold: 0.2, ignoreLocation: true, ignoreFieldNorm: true, findAllMatches: true, useExtendedSearch: true}).search(this.state.search).map(x => x.item) :
            allFiles.sort((a,b) => {
                // @ts-ignore
                let slash = a.Key.match(/\//g).length - b.Key.match(/\//g).length;
                // @ts-ignore
                return slash === 0 ? a.Key.localeCompare(b.Key) : -slash;
            });
        let treeData = BuildTreeFromObjects(results);

        return <>
            <SearchBar setSearch={(value) => this.setState({...this.state, search: value})} state={this.state}/>
            <RichObjectTreeView data={treeData}/>
        </>
    }
}

function SearchBar({setSearch, state}) {
    const [text, setText] = useState('');
    const [value] = useDebounce(text, 600);

    useEffect(() => setSearch(value), [value]);
    let placeholder = allFiles.length !== 0 ? (state.error ? state.error.toString() : "Search here") : "Loading...";

    return <Box display="flex"
                justifyContent="center"
                alignItems="center">
        <TextField
                placeholder={placeholder}
                disabled={placeholder !== "Search here"}
                onChange={(e) => setText(e.target.value)}
                sx={{width: "50%"}}
                />
        </Box>
}

function RichObjectTreeView({data}) {
    const renderTree = (nodes) => (
        nodes.Key ?
            (<Link key={nodes.name} href={'view/' + encodeURI(nodes.Key)} target="_blank" sx={{ display:'block' }}>
                {nodes.name}
            </Link>) :
            (<TreeItem key={nodes.name} nodeId={nodes.name} label={nodes.name} >
                {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
            </TreeItem>)
    );

    return (
        <TreeView
            aria-label="rich object"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpanded={['root']}
            defaultExpandIcon={<ChevronRightIcon />}
            sx={{ height: '80%', flexGrow: 1, maxWidth: '80%', overflowY: 'auto', mx: "auto" }}
        >
            {data.map(node => renderTree(node))}
        </TreeView>
    );
}
export default withAuth(App);

