import Koa from 'koa';
import Router from 'koa-router';
import Serve from 'koa-static';

const App = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
    ctx.response.body = {message: "Hello World!"};
})

App
    .use(router.routes())
    .use(Serve("./res"))
    ;

App.listen(3000);