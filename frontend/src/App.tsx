import React from 'react';
import {
  BrowserRouter as Router,
  Switch, Route, Link, RouteComponentProps } from "react-router-dom";
import { createCveList } from "./amcharts/cveScroll";
import './App.css';
import { makeChart } from './amcharts/wordCloud';
import { makeLineChart } from './amcharts/lineChart';
import { Cve, nimbus_interface } from './interfaces/cve_interface';

const API = process.env.REACT_APP_API || "/api";

const buttonResponder = async (event: React.FormEvent<HTMLFormElement>, 
  dataSetter: React.Dispatch<React.SetStateAction<nimbus_interface>>,
  test: nimbus_interface) => {
  event.preventDefault();
  const formElements = event.target as unknown as HTMLInputElement[];
  const headers = { startdate: formElements[0].value, enddate: formElements[1].value };
  console.log("Loading...");
  const res = await fetch(API, {
    referrerPolicy: "origin-when-cross-origin",
    method: "GET",
    headers: Object.assign({
      "Content-Type": "application/json",
      Accept: "application/json"
    }, headers)
  });
  const raw_data = (await res.json()) as Cve[];
  let processed_data = makeChart(raw_data);
  const nimbusStore: nimbus_interface = {
    rawData: raw_data,
    processedData: processed_data };
  localStorage.setItem('nimbusData', JSON.stringify(nimbusStore));
  dataSetter(nimbusStore);
}

function App() {
  const [data, setData] = React.useState({} as nimbus_interface );
  return (
    <Router>
      <div>
        <div className="App">
          <header className="App-header">
            <nav className="navbar navbar-light bg-light navBar" >
              <Link to="/" className="navbar-brand"><b>.*. NIMBUS</b></Link>
              <button type="button" data-toggle="modal" data-target="#myModal" className="btn btn-secondary my-2 my-sm-0" >&nbsp;<b>?</b>&nbsp;</button>
            </nav>
            <Switch>
              <Route exact path="/"><Home data={[data, setData]}/></Route>
              {/* <Route path="/keyword/:query"><Keyword path /></Route> */}
              {/* <Route path="/keyword/:query" pageComponent={(props: RouteComponentProps<{ query: string }>) => (
                <Keyword query={props.query} />)}></Route> */}
              {/* <Route path="/keyword/:query"><Keyword data={[data, setData]}/></Route> */}

              {/* <Route path="/" exact component={Home} /> */}
              <Route path="/keyword/:query"  component={Keyword} />
            </Switch>
            <div id="footer"><p>&copy; 2020 <b>NIMBUS</b></p></div>
          </header>
        </div>
      </div>
    </Router>
  );
}


function Home(props: { data: [nimbus_interface, React.Dispatch<React.SetStateAction<nimbus_interface>>] }) {
  const [data, setData] = props.data;
  console.log("grabbing home");
  let content = <div id="mainContent">
          {<form id="form" onSubmit={event => buttonResponder(event, setData, data)}>
            <div className="formItem">from:<input type="date" /></div>
            <div className="formItem">to:<input type="date" /></div>
            <div className="formItem" id="submitBtn"><input type="submit"  /></div>
          </form>}
          <div id="chartdiv"></div>
        </div>
  return content;
}


function Keyword({ match }: RouteComponentProps<{query: string}>) {
  // props: { data: [nimbus_interface, React.Dispatch<React.SetStateAction<nimbus_interface>>] }) {
  console.log(`query is ${match.params.query}`);
  // TODO if time: get props working instead of localStorage
  // const [data] = props.data;
  // TODO graphs
  try {
    const nimbusStore: nimbus_interface = JSON.parse(localStorage.getItem('nimbusData')!);
    console.log("is not empty");
    console.log(nimbusStore);
    console.log(`test: ${nimbusStore.rawData[0]}`);
    const cveList = createCveList(nimbusStore, match.params.query);
    makeLineChart(nimbusStore.processedData[match.params.query]);
    let content = 
      <div>
        <h1>Keyword: {match.params.query}</h1>
        <div>
          <div>
            <div id="chartdiv2" style={{width: "100%", height: "50vh"}}></div>
          </div>
          <div>            
            <p>chart 2: pie</p>
            <div>{cveList}</div>
          </div>
        </div>
      </div>;
    return content;
  } catch(e) {
    console.log(e);
    return <div><h1>The keyword {match.params.query} is not indexed</h1>
      <p>Please reload home and select a keyword from the processed data</p></div>;
  }
}

export default App;
