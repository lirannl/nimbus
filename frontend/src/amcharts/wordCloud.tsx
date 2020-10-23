import '../App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Cve } from '../interfaces/cve_interface';
am4core.useTheme(am4themes_animated);

export interface keywordMap {
    [keyword: string]: {
       count: number,
       severity: number[],
       cves: {
            [cveTag: string]: {
                Published: Date;
                severity: number;
            }
        }
    }
}

function setWordCloud() {
    const wordCloud = am4core.create("wordCloud", am4plugins_wordCloud.WordCloud);
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
    keywordSeries.labels.template.url = `/keyword/{word}`;
    keywordSeries.labels.template.urlTarget = "_self";
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

/**
 * Count & map entities to a dictionary 
 * @param data Original data from API
 * @returns { keyword: { "count": count, "avgSeverity": avgSeverity, "cveList": string[] } }
 */
function getCommonWords(data: Cve[]) {
    let keywordMap: keywordMap = {};
    // let totalCVEs = 0;
    // let totalEntitiesCount = 0;
    // console.log(`data: ${data}`);
    data.map((cve_interface, index) => {
        // console.log(data[0]);
        // totalCVEs++;
        let entityPerCVECount = 0;
        // For each entity in the cve data
        return cve_interface.entities.forEach((entity, index) => {
            if (entityPerCVECount < 3) {
                if (entity.type !== "NUMBER") {
                    entityPerCVECount++;
                    // totalEntitiesCount++;
                    if (keywordMap.hasOwnProperty(entity.name)) {
                        keywordMap[entity.name]["severity"].push(cve_interface.cvss);
                        keywordMap[entity.name]["cves"][cve_interface.id] = {
                            "Published": cve_interface.Published,
                            "severity": cve_interface.cvss
                        }
                        keywordMap[entity.name]["count"]++;
                    } else {
                        keywordMap[entity.name] = {
                            "count": 1,
                            "severity": [cve_interface.cvss],
                            "cves": {
                                [cve_interface.id] : {
                                    "Published": cve_interface.Published,
                                    "severity": cve_interface.cvss
                                }
                            }
                        };
                    }
                    // console.debug(`${entity.name} - Type: ${entity.type}, Salience: ${entity.salience}`);
                }
            }
        });
        // console.debug(`total CVEs for time period: ${totalCVEs}`);
        // console.debug(`total keywords for time period: ${totalEntitiesCount}`);
    })
    // console.debug(`Total non duplicate keywords for time period: ${Object.keys(keywordMap).length}`);
    return keywordMap;
}

/**
 * Sort object by average severity of keywords
 * @returns { name: string, total: number, avgSeverity: number, cveList: string[] }
 */
function sortKeywords(keywordMap: keywordMap) {
    const unsorted = Object.keys(keywordMap).map(function (key: string) {
        const sum = keywordMap[key].severity.reduce((a, b) => a + b, 0);
        const avg = (sum / keywordMap[key].severity.length) || 0;
        return { name: key, total: keywordMap[key].count, avgSeverity: avg, cves: keywordMap[key].cves }
    });
    return unsorted.sort(function (a, b) { return b.total - a.total });
}

/**
 * Build the keyword word cloud
 * @param data The CVE data to build the world cloud from
 * @returns 100 keywords in am4plugins_wordCloud.WordCloud form
 */
export function buildWordCloud(data: Cve[]): keywordMap  {
    let keywordSeries = setWordCloud();
    let words: {cveTag: string, avgSeverity: number}[] = [];
    let keywordMap = getCommonWords(data);
    let sortedKeywords = sortKeywords(keywordMap);
    sortedKeywords.forEach(function (value) {
        words.push({
            "cveTag": value.name, 
            "avgSeverity": value.avgSeverity
        })
      }); 
    keywordSeries.data = words.slice(0,100);
    const keymap = sortedKeywords.reduce((acc, curr)=>{
        return Object.assign({}, acc, {[curr.name]: {
            total: curr.total,
            avgSeverity: curr.avgSeverity,
            cves: curr.cves
        } })
    },{});
    return keymap;
}