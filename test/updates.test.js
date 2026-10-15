const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createUpdatesRouter } = require('../src/api/routes/updates.routes');
const { errorHandler } = require('../src/middleware/error.middleware');

function setup() {
  const entries = [];
  const collection = {
    async add(data) { const id = String(entries.length + 1); entries.push({ id, data }); return { id }; },
    orderBy(field, direction) { assert.equal(direction, 'desc'); assert.ok(['publishedAt', '__name__'].includes(field)); return this; },
    limit() { return this; },
    async get() { return { docs: [...entries].sort((a,b) => b.data.publishedAt.localeCompare(a.data.publishedAt)).map(entry => ({ id:entry.id, data:() => entry.data })) }; },
  };
  const app = express(); app.use(express.json());
  let tick = 0;
  app.use('/api/updates', createUpdatesRouter({db:{collection:() => collection}, now:() => new Date(Date.UTC(2026,9,2,12, tick++)), authenticate:(req,res,next) => {
    if(!req.headers.authorization) return res.status(401).json({error:'Unauthorized'});
    req.user = {uid:'user-1',role:req.headers.authorization}; next();
  }}));
  app.use(errorHandler);
  return {app, entries};
}
async function run(callback) {
  const { app, entries } = setup(); const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const url=`http://127.0.0.1:${server.address().port}/api/updates`;
  const post=(data, role='editor') => fetch(url,{method:'POST',headers:{'Content-Type':'application/json', ...(role ? {Authorization:role} : {})},body:JSON.stringify(data)});
  try {await callback({url,post,entries});} finally {await new Promise(resolve => server.close(resolve));}
}
const data={title:' Aviso ',message:' Mensaje\nSegunda línea ',author:' Pastor '};
test('Only admins and editors can publish; required fields and server-owned date are enforced', async () => run(async ({post,entries}) => {
  assert.equal((await post(data,null)).status,401);
  assert.equal((await post(data,'member')).status,403);
  assert.equal((await post({...data,title:' '})).status,400);
  assert.equal((await post({...data,publishedAt:'2099-01-01'})).status,400);
  assert.equal((await post({...data,message:'x'.repeat(3001)})).status,400);
  const response=await post(data,'admin'); assert.equal(response.status,201);
  const result=await response.json(); assert.equal(result.title,'Aviso'); assert.equal(result.author,'Pastor');
  assert.equal(result.publishedAt,'2026-10-02T12:00:00.000Z'); assert.equal(entries[0].data.createdBy,'user-1');
}));
test('Public feed returns newest update first and rejects invalid pagination', async () => run(async ({url,post}) => {
  await post(data); await post({...data,title:'Más reciente'});
  const response=await fetch(url); assert.equal(response.status,200);
  const updates=await response.json(); assert.equal(updates[0].title,'Más reciente'); assert.equal(updates.length,2);
  assert.equal(updates[0].createdBy,undefined);
  assert.equal((await fetch(`${url}?limit=-1`)).status,400);
}));
