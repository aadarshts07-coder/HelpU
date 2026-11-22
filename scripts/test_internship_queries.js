async function test() {
  const portals = ['bosch', 'cisco', 'redhat', 'pricol'];
  for (const portal of portals) {
    try {
      const res = await fetch(`http://localhost:3000/api/search/jobs?source=${portal}&type=internship`);
      console.log(`[${portal} | type=internship] status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`  Found: ${data.total} listings. First:`, data.jobs?.[0]?.title);
      }
    } catch (e) {
      console.error(portal, e.message);
    }
  }
}
test();
