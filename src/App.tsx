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
import {Box, TextField} from "@mui/material";

Amplify.configure(awsconfig);

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
    console.log(useParams())
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
        this.state = {files: [], fuse: null, search: ''};
    }

    async componentDidMount() {
        try {
            let allFiles = await GetAllFiles("");
            console.log(allFiles);
            let fuse = new Fuse(allFiles, {keys: ['Key'], threshold: 0.3, ignoreLocation: true, useExtendedSearch: true})
            this.setState({files: allFiles, fuse: fuse, search: ''});
            console.log("Load all files complete.");
        } catch (err) {
            console.error(err);
            this.setState({...this.state, error: err});
        }
    }

    render() {
        let results = this.state.fuse && this.state.search ? this.state.fuse.search(this.state.search).map(x => x.item) : this.state.files;
        let treeData = BuildTreeFromObjects(results);
        console.log(treeData);

        return <>
           <SearchBar setSearch={(value) => {
               this.setState({...this.state, search: value})
           }} state={this.state}/>
            <RichObjectTreeView data={treeData}/>
        </>
    }
}

function SearchBar({setSearch, state}) {
    const [text, setText] = useState('');
    const [value] = useDebounce(text, 600);

    useEffect(() => setSearch(value), [value]);
    let placeholder = state.fuse ? (state.error ? state.error.toString() : "Search here") : "Loading...";

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
    const onClick = (e) => {
        let fileKey = e.target.closest("li").dataset.key;
        if (fileKey) window.open(document.location.href + 'view/' + encodeURI(fileKey), '_blank');
    }
    const renderTree = (nodes) => (
        <TreeItem key={nodes.name} nodeId={nodes.name} label={nodes.name} data-key={nodes.Key} onClick={onClick} >
            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
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

