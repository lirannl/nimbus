import Application from "koa";
import Router from "koa-router";
import getCVEs from "../circlu/circluRetriever";

const main = async (ctx: Application.ParameterizedContext<any, Router.IRouterParamContext<any, {}>>) => {
    const cves = await getCVEs(new Date(ctx.request.headers["startdate"]), new Date(ctx.request.headers["enddate"]));
    ctx.response.body = cves;
}

export default main;