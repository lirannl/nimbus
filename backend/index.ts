import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';
import Serve from 'koa-static';
import getCVEs from './circlu/circluRetriever';

const App = new Koa();
const api_r = new Router();
const router = new Router();

router.get("/", async (ctx) => {
    const cves = await getCVEs(new Date(ctx.request.headers["startdate"]), new Date(ctx.request.headers["enddate"]));
    ctx.response.body = cves;
});

// Set the API's prefix to /api
api_r.use("/api", router.routes());

// Allow CORS in development since the frontend and backend are served separately
// require is used so that cors is not a production dependency
if (process.env.TYPE = "development") App.use(cors());

App
    .use(Serve("./res"))
    .use(api_r.routes())
    ;

App.listen(parseInt(process.env.PORT || "3000"));