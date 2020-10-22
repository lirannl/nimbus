/* Imports */
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

/* Chart code */
// Themes begin
am4core.useTheme(am4themes_animated);

function setLineChart(correlated_dates:any) {
    let chart = am4core.create("chartdiv2", am4charts.XYChart);
    chart.colors.step = 2;
    chart.data = generateChartData(correlated_dates);
    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.minGridDistance = 50;
    createAxisAndSeries(chart, "CVECount", "CVECount", false);
    createAxisAndSeries(chart, "AvgSeverity", "AvgSeverity", true);
    chart.legend = new am4charts.Legend();
    chart.cursor = new am4charts.XYCursor();
    // chart.fontSize = 5;
    // chart?.svgContainer?.htmlElement?.style?.height = 300 + "px";
    // chart?.svgContainer?.height = 300 + "px"
}


function createAxisAndSeries(chart:am4charts.XYChart, field:any, name:string, opposite:any) {
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis() as any);
    if (chart.yAxes.indexOf(valueAxis) != 0)  valueAxis.syncWithAxis = chart.yAxes.getIndex(0);
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = field;
    series.dataFields.dateX = "date";
    series.strokeWidth = 2;
    series.yAxis = valueAxis;
    series.name = name;
    series.tooltipText = "{name}: [bold]{valueY}[/]";
    series.tensionX = 0.8;
    series.showOnInit = true;

    let interfaceColors = new am4core.InterfaceColorSet();
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.stroke = interfaceColors.getFor("background");
    bullet.circle.strokeWidth = 2;

    valueAxis.renderer.line.strokeOpacity = 1;
    valueAxis.renderer.line.strokeWidth = 2;
    valueAxis.renderer.line.stroke = series.stroke;
    valueAxis.renderer.labels.template.fill = series.stroke;
    valueAxis.renderer.opposite = opposite;
}


export interface date_correlation {
    [date: string]: {
        CVECount: number;
        AvgSeverity: number[];
    }
}

function correlate_dates(keywordData:any) {
    let d: date_correlation = { };
    Object.keys(keywordData.cves).map((cve:string, index) => {
        if (d.hasOwnProperty(keywordData.cves[cve].Published)) {
            d[keywordData.cves[cve].Published]["AvgSeverity"].push(keywordData.cves[cve].severity);
            d[keywordData.cves[cve].Published]["CVECount"]++;
        } else {
            d[keywordData.cves[cve].Published] = {
                "CVECount": 1,
                "AvgSeverity": [keywordData.cves[cve].severity],
            };
        }
    });
    return d
}

function generateChartData(correlated_dates:date_correlation) {
    let chartData:any = [];
    Object.keys(correlated_dates).map((day,index) => {
        let newDate = new Date(day);
        newDate.setHours(0, 0, 0, 0);
        console.log(newDate)
        const sum = correlated_dates[day].AvgSeverity.reduce((a, b) => a + b, 0);
        const avg = (sum / correlated_dates[day].AvgSeverity.length) || 0;
        chartData.push({
            date: newDate,
            CVECount: correlated_dates[day].CVECount,
            AvgSeverity: avg 
        });
    })
    return chartData;
}

export function makeLineChart(keywordData:any) {
    console.log(keywordData);
    setLineChart(correlate_dates(keywordData))
}
