async function verifyLiveRunAllowance() {
  const url = 'https://cognerd-6ab6bd50-amans-org-43ae3aeb.app.nitrocloud.ai/mcp';
  const token = 'NXLbPeKvZQIbNLtvA8YnMEUBLNOsEmq6.OJrPdZtFurEfopS6zuxhnz8HMbLPUcVaUVvUpY9W7Hs=';
  console.log('Polling NitroCloud live deployment for Run System updates...');

  for (let i = 1; i <= 30; i++) {
    try {
      // 1. Call get_run_allowance
      const runRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'get_run_allowance',
            arguments: {}
          }
        })
      });

      const bodyText = await runRes.text();
      console.log(`[Attempt ${i}] get_run_allowance: ${runRes.status}`);

      if (runRes.status === 200 && bodyText.includes('next-run-allowance.html')) {
        console.log('🎉 Live deployment updated! get_run_allowance is now attached to next-run-allowance.html!');
        console.log('Snippet:', bodyText.slice(0, 400));

        // 2. Also check whoami
        const whoRes = await fetch(url, {
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

        const whoText = await whoRes.text();
        console.log(`whoami: ${whoRes.status}`);
        console.log('whoami snippet:', whoText.slice(0, 400));
        process.exit(0);
      }
    } catch (err) {
      console.log(`[Attempt ${i}] Network error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log('Timed out waiting for new build deployment.');
  process.exit(1);
}

verifyLiveRunAllowance();
