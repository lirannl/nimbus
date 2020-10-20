import '../App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

function setWordCloud() {
    const wordCloud = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
    wordCloud.fontFamily = "Courier New";
    const keywordSeries = wordCloud.series.push(new am4plugins_wordCloud.WordCloudSeries() as any);
    keywordSeries.minFontSize = "50%";
    // keywordSeries.maxFontSize = "100%";
    keywordSeries.randomness = 0.6;
    keywordSeries.rotationThreshold = 0.0;
    keywordSeries.dataFields.word = "cveTag";
    keywordSeries.dataFields.value = "avgSeverity";
    // keywordSeries.dataFields.tag = "cweTag";
    keywordSeries.heatRules.push({
        "target": keywordSeries.labels.template,
        "property": "fill",
        "min": am4core.color("#0000CC"),
        "max": am4core.color("#CC00CC"),
        "dataField": "value"
    });
    
    // const regexp = new RegExp('CWE-([0-9]{3})');
    keywordSeries.labels.template.url = `https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword={word}`;
    // keywordSeries.labels.template.url = `https://cwe.mitre.org/data/definitions/${"{word}".match(regexp) as any [0]}.html`;
    // keywordSeries.labels.template.url = "https://cwe.mitre.org/data/definitions/{word}.html";
    keywordSeries.labels.template.urlTarget = "_blank";
    keywordSeries.labels.template.tooltipText = "Avg Severity: {value}";
    let hoverState = keywordSeries.labels.template.states.create("hover");
    hoverState.properties.fill = am4core.color("#FF0000");
    // let subtitle = chart.titles.create();
    // subtitle.text = "(click to open)";
    // let title = chart.titles.create();
    // title.text = "Most Popular Tags @ StackOverflow";
    // title.fontSize = 20;
    // title.fontWeight = "800";
    return keywordSeries;
}


export interface keywordMap {
    [keyword: string]: {
       count: number,
       severity: number[],
       cveList: string[]
    }
}
/**
 * Count & map entities to a dictionary 
 * @param data Original data from API
 * @returns { keyword: { "count": count, "avgSeverity": avgSeverity, "cveList": string[] } }
 */
function getCommonWords(data: any[]) {
    let keywordMap: keywordMap = {};
    let totalCVEs = 0;
    let totalEntitiesCount = 0;
    Object.entries(data).map( day => {
        console.debug(`Number of CVEs for ${day[0]}: ${day[1].length}`);
        // For each CVE of current day, get top 3 salient entities
        day[1].map((cve_interface: any, index: string) => {
            totalCVEs++;
            let entityPerCVECount = 0;
            // For each entity in the cve data
            return cve_interface.entities.forEach((entity: any, index: string) => {
                if (entityPerCVECount < 3) {
                    if (entity.type !== "NUMBER") {
                        entityPerCVECount++;
                        totalEntitiesCount++;
                        if (keywordMap.hasOwnProperty(entity.name)) {
                            keywordMap[entity.name]["severity"].push(cve_interface.cvss);
                            keywordMap[entity.name]["cveList"].push(cve_interface.id);
                            keywordMap[entity.name]["count"]++;
                        } else {
                            keywordMap[entity.name] = {
                                "count": 1,
                                "severity": [cve_interface.cvss],
                                "cveList": [cve_interface.id]
                            };
                        }
                        // console.debug(`${entity.name} - Type: ${entity.type}, Salience: ${entity.salience}`);
                    }
                }
            });
        })
        console.debug(`total CVEs for time period: ${totalCVEs}`);
        // console.debug(`total keywords for time period: ${totalEntitiesCount}`);
    })
    console.debug(`Total non duplicate keywords for time period: ${Object.keys(keywordMap).length}`);
    return keywordMap;
}

/**
 * Sort object by average severity of keywords
 * @returns { name: string, total: number, avgSeverity: number, cveList: string[] }
 */
function sortKeywords(keywordMap: keywordMap) {
    let sorted = [];
    sorted = Object.keys(keywordMap).map(function (key: string) {
        const sum = keywordMap[key].severity.reduce((a, b) => a + b, 0);
        // console.debug(`start: ${keywordMap[key].severity}`)
        // console.debug(`sum: ${sum}`)
        const avg = (sum / keywordMap[key].severity.length) || 0;
        return { name: key, total: keywordMap[key].count, avgSeverity: avg, cveList: keywordMap[key].cveList }
    });
    sorted.sort(function (a, b) { return b.avgSeverity - a.avgSeverity });
    // console.debug(`sorted keywords: ${sorted}`);
    return sorted;
}

/**
 * Build the keyword word cloud
 * @param data The CVE data to build the world cloud from
 * @returns 50 keywords in am4plugins_wordCloud.WordCloud form
 */
export function makeChart(data: any[])  {
    let keywordSeries = setWordCloud();
    let words: any = [];
    let keywordMap = getCommonWords(data);
    let sortedKeywords = sortKeywords(keywordMap);
    sortedKeywords.forEach(function (value) {
        words.push({
            "cveTag": value.name, 
            "avgSeverity": value.avgSeverity
        })
      }); 
    keywordSeries.data = words; //.slice(0,50);
    return keywordSeries;
}