import React from 'react';
import {
  BrowserRouter as Router,
  Switch, Route, Link, RouteComponentProps } from "react-router-dom";
import { createCveList } from "./amcharts/cveScroll";
import './App.css';
import { buildWordCloud } from './amcharts/wordCloud';
import { buildLineChart } from './amcharts/lineChart';
import { buildPieChart } from './amcharts/pieChart';
import { Cve, nimbus_interface } from './interfaces/cve_interface';

const API = process.env.REACT_APP_API || "/api";
const MakeStateful = (init: any) => {
  const [state, setState] = React.useState(init);
  return {
    getter: () => state,
    setter: setState,
    get value() {
      return state;
    },
    set value(newVal) {
      setState(newVal);
    },
  };
};

function App() {
  const [data, setData] = React.useState({} as nimbus_interface );
  return ( 
    <Router>
      <div>
        <div className="App">
          <header className="App-header">
            <nav className="navbar navbar-light bg-light navBar">
              <Link to="/" className="navbar-brand"><img id="nav-logo" src="../nimbus-logo.png" alt="Nimbus logo"/><b> NIMBUS</b></Link>
              <button type="button" data-toggle="modal" data-target="#helpModal" className="btn btn-light my-2 my-sm-0" id="modalBtn">&nbsp;<b>?</b>&nbsp;</button>
            </nav> {popUp}
            <Switch>
              <Route exact path="/"><Home data={[data, setData]}/></Route>
              <Route path="/keyword/:query"  component={Keyword} />
              <Route component={NotFound} />
              <Route><p>this is not good</p></Route>
            </Switch>
            <div id="footer"><p>&copy; 2020 <b>NIMBUS</b></p></div>
          </header>
        </div>
      </div>
    </Router>
  );
}

export default App;

function Home(props: { data: [nimbus_interface, React.Dispatch<React.SetStateAction<nimbus_interface>>] }) {
  const [data, setData] = props.data;
  const loading = MakeStateful(false);
  const buttonResponder = async (event: React.FormEvent<HTMLFormElement>, 
    dataSetter: React.Dispatch<React.SetStateAction<nimbus_interface>>,
    test: nimbus_interface) => {
    event.preventDefault();
    const formElements = event.target as unknown as HTMLInputElement[];
    const headers = { startdate: formElements[0].value, enddate: formElements[1].value };
    if (headers.startdate < "1999" || headers.enddate > "2021") {
      return document.getElementById('form-error')!.textContent = "Please ensure your dates are between 1999 and 2020";
    } 
    if (headers.startdate > headers.enddate) {
      return document.getElementById('form-error')!.textContent = "Please ensure your end date is before your start date";
    }
    document.getElementById('form-error')!.textContent = "";
    console.log("Loading...");
    loading.value = true;
    const res = await fetch(API, {
      referrerPolicy: "origin-when-cross-origin",
      method: "GET",
      headers: Object.assign({
        "Content-Type": "application/json",
        Accept: "application/json"
      }, headers)
    });
    const raw_data = (await res.json()) as Cve[];
    loading.value = false;
    let processed_data = buildWordCloud(raw_data);
    const nimbusStore: nimbus_interface = { processedData: processed_data };
    localStorage.setItem('nimbusData', JSON.stringify(nimbusStore));
    dataSetter(nimbusStore);
  }
  // localStorage.clear();
  return <div id="mainHomeContent"><br />
    {<form id="form" onSubmit={event => buttonResponder(event, setData, data)}>
      <div className="formItem">from:<input type="date" /></div>
      <div className="formItem">to:<input type="date" /></div>
      <div className="formItem" id="submitBtn"><input type="submit" /></div>
    </form>}
    <div id="form-error"></div>
    {loading.value ? <div className="spinner-border text-light"></div> : <div id="wordCloud" style={{height: "65vh"}}></div>}
  </div>
}

function Keyword({ match }: RouteComponentProps<{query: string}>) {
  console.log(`query is ${match.params.query}`);
  try {
    const nimbusStore: nimbus_interface = JSON.parse(localStorage.getItem('nimbusData')!);
    console.log(nimbusStore);
    const cveList = createCveList(nimbusStore, match.params.query);
    buildLineChart(nimbusStore.processedData[match.params.query]);
    buildPieChart(nimbusStore.processedData[match.params.query])
    return <div id="mainKeywordContent">
        <div className="container-fluid">
          <h1>Keyword: "{match.params.query}"</h1>
            <div className="row-1">
              <div id="lineGraph"></div>
            </div>
            <br />
          <div className="row">
            <div className="col"></div>
            <div className="col-5" id="left">
              <h4 className="title"><b>Severity Ratio</b></h4>
              <div id="pieChart"></div>
            </div>
            <div className="col"> </div>
            <div className="col-5" id="right">
              <h4 className="title"><b>Top CVEs for {match.params.query}</b></h4>
              <div id="scrollable"> {cveList} </div>
            </div>
            <div className="col"> </div>
          </div><br />
        </div>
      </div>;
  } catch(e) {
    return <div className="container-fluid" id="error-page">
      <span>
        <h1>The keyword "{match.params.query}" is not indexed</h1>
        <p>You will be redirected to the home page in 5 seconds.</p>
        <script>
          { setTimeout(function(){window.location.href = '/'; }, 5000)}
        </script>
        <p>:'(</p>
      </span>
    </div>
  }
}

function NotFound() {
  return <div className="container-fluid" id="error-page">
  <span>
    <h1>Oh no!</h1>
    <p>This page doesn't exist. Try <a href="/"><i className="fas fa-home"></i></a>?</p>
    <p>:'(</p>
  </span>
</div>;
}

const popUp = <div className="container"><div className="modal" id="helpModal">
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header"><h4 className="modal-title"><b>Getting Started</b></h4>
      <button type="button" className="close" data-dismiss="modal">&times;</button></div>
      <div className="modal-body">
        <p>Select a time frame on the home page and click enter. From here you can select a keyword and see detailed analysis.</p>
        <p><b>Limits</b></p>
        <ul>
          <li>Google Cloud API allows up to 600 requests every 1 min window. Should this rate limit be hit, Nimbus will wait 1 min before re-attempting.</li>
          <li>CVSS scores are typically 5.0 until NVD/NIST completes their analysis, usually within 1-2 weeks of publishing.</li>
        </ul>
      </div>
      <div className="modal-footer">
          <button type="button" className="btn btn-danger" id="modalBtnClose" data-dismiss="modal">Close</button></div>
      </div>
    </div>
  </div>
</div>