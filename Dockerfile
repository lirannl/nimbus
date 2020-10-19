FROM node:current-alpine as transpilation
COPY ./backend /backend
WORKDIR /backend
RUN npm i
RUN npx tsc

FROM node:current-alpine as frontend_compile
COPY ./frontend /frontend
WORKDIR /frontend
RUN npm install
RUN npm run-script build

FROM node:current-alpine
WORKDIR /app
# Copy transpiled source
COPY --from=transpilation /backend/build .
COPY --from=transpilation /backend/package.json .
# Install dependencies
RUN npm install --production
# Add static resources
COPY --from=frontend_compile /frontend/build ./res
RUN mkdir -p /root/.aws
RUN touch /root/.aws/credentials
RUN touch /root/.aws/config
# Set up production envrionment variables
ENV TYPE=production
ENV PORT=80
EXPOSE 80
# Start the run-prod script for the project
CMD [ "npm", "run-script", "run-prod" ]