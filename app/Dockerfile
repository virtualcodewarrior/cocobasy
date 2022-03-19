FROM denoland/deno:alpine-1.19.2
EXPOSE 8080
RUN deno install --allow-all https://deno.land/x/denon/denon.ts
WORKDIR /app
CMD ["denon", "run", "--allow-all", "main.ts"]
