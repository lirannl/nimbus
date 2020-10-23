import React from 'react';
import { nimbus_interface } from '../interfaces/cve_interface';

/**
 * Build severity button with associated colour
 * @param severity CVSS score (between 0 and 10)
 */
function buildSeverityBtn(severity: number) {
    if (severity > 0.0 && severity <= 3.9) {
        return <span className="badge badge-success">{severity} Low</span>
    } else if (severity >= 4.0 && severity <= 6.9) {
        return <span className="badge badge-warning">{severity} Medium</span>
    } else if (severity >= 7.0 && severity <= 8.9) {
        return <span className="badge badge-warning" style={{ backgroundColor: "darkorange"}}>{severity} High</span>
    } else {
        return <span className="badge badge-danger">{severity} Critical</span>
    }
}

/**
 * Create the scrollable CVE list
 * @param data CVE data from home page query
 * @param keyword The keyword selected by user
 */
export function createCveList(data: nimbus_interface, keyword: string) {
    return <div>{Object.keys(data.processedData[keyword].cves).map((cve, index) => 
        <div key={`${index}`}>{cve} {buildSeverityBtn(data.processedData[keyword].cves[cve].severity)}</div>)}
        {/* <div>{cve} {data.processedData[keyword].cves[cve].severity} {data.processedData[keyword].cves[cve].Published}</div>)} */}
    </div>
}