async function testRedHat() {
  const query = 'engineer';
  try {
    const initRes = await fetch('https://redhat.wd5.myworkdayjobs.com/Jobs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Init status:', initRes.status);
    const cookies = initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie')];
    const cookieHeader = cookies.filter(Boolean).map(c => c.split(';')[0]).join('; ');

    const res = await fetch('https://redhat.wd5.myworkdayjobs.com/wday/cxs/redhat/Jobs/jobs', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookieHeader,
        'Origin': 'https://redhat.wd5.myworkdayjobs.com',
        'Referer': 'https://redhat.wd5.myworkdayjobs.com/Jobs'
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 5,
        offset: 0,
        searchText: query
      })
    });
    console.log('Red Hat jobs status:', res.status);
    if (!res.ok) {
      const text = await res.text();
      console.log('Error text:', text.substring(0, 200));
      return;
    }
    const data = await res.json();
    console.log('Red Hat total:', data.total);
    console.log('Red Hat first job:', data.jobPostings?.[0]?.title);
  } catch (err) {
    console.error('Red Hat err:', err);
  }
}
testRedHat();
