
export function setupRoutes(server, processMessageFunction) {
    server.get('/v0/connect', processMessageFunction);
    server.get('/v0/login', processMessageFunction);
    server.get('/v0/query', processMessageFunction);
    server.get('/v0/tables', processMessageFunction);
    server.get('/v0/disconnect', processMessageFunction);
    server.get('/v1/connect', processMessageFunction);
    server.get('/v1/authenticate', processMessageFunction);
    server.get('/v1/databases', processMessageFunction);
    server.get('/v1/selectdatabase', processMessageFunction);
    server.get('/v1/tables', processMessageFunction);
    server.get('/v1/preview', processMessageFunction);
    server.get('/v1/query', processMessageFunction);
    server.get('/v1/disconnect', processMessageFunction);
}
