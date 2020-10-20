import React from 'react';
import './App.css';
import { makeChart } from './amcharts/wordCloud'

const API = process.env.REACT_APP_API || "/api";

const buttonResponder = async (event: React.FormEvent<HTMLFormElement>, dataSetter: React.Dispatch<React.SetStateAction<{
  [date: string]: any[];
}>>) => {
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
  const data = await res.json();
  // const test = document.querySelector<HTMLElement>('#chartdiv')!;
  // test.style.backgroundColor = 'white';
  dataSetter(data);
  makeChart(data);
}



function App() {
  const [data, setData] = React.useState({} as { [date: string]: any[] });
  return (
    <div className="App">
      <header className="App-header">
        <nav className="navbar navbar-light bg-light navBar" >
          <a className="navbar-brand" href="/">
            <b>.*. NIMBUS</b> 
          </a>
          <button type="button" data-toggle="modal" data-target="#myModal" className="btn btn-secondary my-2 my-sm-0" >&nbsp;<b>?</b>&nbsp;</button>
        </nav>
        <div className="container"><div className="modal" id="myModal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h4 className="modal-title">Getting Started</h4>
                <button type="button" className="close" data-dismiss="modal">&times;</button></div>
                <div className="modal-body">
                  <p><b>Welcome to Nimbus!</b></p>
                  <ul>
                    <li>TODO</li>
                    <li>...</li>
                  </ul>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-dismiss="modal"><b>Close</b></button></div>
                </div>
            </div>
          </div>
        </div>
        <div id="mainContent">
          {<form id="form" onSubmit={event => buttonResponder(event, setData)}>
            <div className="formItem">from:<input type="date" /></div>
            <div className="formItem">to:<input type="date" /></div>
            <div className="formItem" id="submitBtn"><input type="submit"  /></div>
          </form>}
          <div id="chartdiv"></div>
        </div>
        {/* {Object.entries(data).map( day => 
          day[1].map((val, index) => 
            <div key={`${day[0]}-${index}`}>{val.Published} {val.cwe} {val.summary}</div>
          )
        )} */}
        <div id="footer">
          <p>&copy; 2020 <b>NIMBUS</b></p></div>
      </header>
    </div>
  );
}

export default App;
