(async () => {
    const { data } = await axios.get("http://localhost:3000/get-ics/upcoming");
    console.log(data);
})();
