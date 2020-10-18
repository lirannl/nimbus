import '../App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

const chart = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
chart.fontFamily = "Courier New";
const series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries() as any);
series.minFontSize = "50%";
series.randomness = 0.0;
series.rotationThreshold = 0.5;
series.dataFields.word = "cveTag";
series.dataFields.value = "avgSeverity";
// series.dataFields.tag = "cweTag";
series.heatRules.push({
    "target": series.labels.template,
    "property": "fill",
    "min": am4core.color("#0000CC"),
    "max": am4core.color("#CC00CC"),
    "dataField": "value"
});

// const regexp = new RegExp('CWE-([0-9]{3})');
series.labels.template.url = `https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword={word}`;
// series.labels.template.url = `https://cwe.mitre.org/data/definitions/${"{word}".match(regexp) as any [0]}.html`;
// series.labels.template.url = "https://cwe.mitre.org/data/definitions/{word}.html";
series.labels.template.urlTarget = "_blank";
series.labels.template.tooltipText = "Avg Severity: {value}";
let hoverState = series.labels.template.states.create("hover");
hoverState.properties.fill = am4core.color("#FF0000");
// let subtitle = chart.titles.create();
// subtitle.text = "(click to open)";
// let title = chart.titles.create();
// title.text = "Most Popular Tags @ StackOverflow";
// title.fontSize = 20;
// title.fontWeight = "800";

/**
 * Build the keyword word cloud
 * @param data The CVE data to build the world cloud from
 * @returns am4plugins_wordCloud.WordCloud
 */
export function makeChart(data: any[]) {
    // TODO currently uses first 25 CWE tags instead of keywords
    let words: any = [];
    // console.log("CWE-202".match(regexp) as any [0]);
    // const regexp = new RegExp('CWE-([0-9]{3})');
    // console.log("CWE-222".match(regexp)![0]! as any);
    Object.entries(data).map( day => 
        day[1].map((val:any, index:string) => 
            words.push({
                "cveTag": val.cwe, 
                "avgSeverity": Math.floor(Math.random() * 20) + 1,
            })
        )
    )
    console.debug(words);
    series.data = words.slice(0, 25);
    return chart;
}