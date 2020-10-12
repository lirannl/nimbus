import React from 'react';
import './App.css';

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
  dataSetter(data);
}

function App() {
  const [data, setData] = React.useState({} as { [date: string]: any[] });
  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={event => buttonResponder(event, setData)}>
          from:<input type="date" /><br />
          to:<input type="date" /><br/>
          <input type="submit" />
        </form>
        {Object.entries(data).map(day => day[1].map((val, index) => <div key={`${day[0]}-${index}`}>{val.summary}</div>))}
      </header>
    </div>
  );
}

export default App;
