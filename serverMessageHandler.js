export function serverMessageHandler(sequelizeManager, mainWindowContents) {
	return (requestEvent, respondEvent) => {
		const query = requestEvent.query.statement;
		sequelizeManager.updateLog(mainWindowContents, query);
		sequelizeManager.receiveServerQuery(respondEvent, mainWindowContents, query)
		.catch(error => {
			mainWindowContents.send('channel', {error});
			respondEvent.send({error});
		});
	};
}
