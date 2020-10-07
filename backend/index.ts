import Koa from 'koa';
import Router from 'koa-router';
import Serve from 'koa-static';
import circluReq from './circlu/circluRetriever';

const App = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
    const cves = await circluReq(new Date("September 2 2020"), new Date("September 8 2020"));
    ctx.response.body = cves;
})

App
    .use(router.routes())
    .use(Serve("./res"))
    ;

App.listen(3000);