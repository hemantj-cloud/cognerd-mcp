async function waitLive() {
  const url = 'https://cognerd-6ab6bd50-amans-org-43ae3aeb.app.nitrocloud.ai/mcp';
  const token = 'NXLbPeKvZQIbNLtvA8YnMEUBLNOsEmq6.OJrPdZtFurEfopS6zuxhnz8HMbLPUcVaUVvUpY9W7Hs=';
  console.log('Polling NitroCloud deployment at:', url);

  for (let i = 1; i <= 20; i++) {
    try {
      // 1. Check tools/list
      const listRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      // 2. Check tools/call whoami
      const callRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'whoami',
            arguments: {}
          }
        })
      });

      console.log(`[Attempt ${i}] tools/list: ${listRes.status}, tools/call: ${callRes.status}`);

      if (listRes.status === 200 && callRes.status === 200) {
        const callBody = await callRes.text();
        console.log('🎉 LIVE VERIFICATION SUCCESSFUL! Both tools/list and tools/call return 200 OK!');
        console.log('Snippet:', callBody.slice(0, 300));
        process.exit(0);
      }
    } catch (err) {
      console.log(`[Attempt ${i}] Fetch error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 6000));
  }
  console.log('Deployment still in progress. Check again soon.');
  process.exit(1);
}

waitLive();
