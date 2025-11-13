// formatICS.js: make sense of the ics data in a way thats easy for the client
import ICAL from "ical.js";
export function formatICS(ics) {
    const orderedEvents = [];

    ics = ICAL.parse(ics);
    // ics = [_, timezoneInfo, actualEvents]
    ics = ics[2];

    const ignoreTags = { "dtstamp": true, "uid": true, "created": true, "last-modified": true, "sequence": true, "status": true, "transp": true };
    const tagMapping = { "location": "price" } // fsr the location is where the price is stored lol.
    for (let i = 1; i < ics.length; i++) {
        const eventInfoArr = ics[i][1];
        const flattened = eventInfoArr.reduce((a, cv) => {
            let [tag, _, __, data] = cv;
            if (ignoreTags[tag]) { return a };
            if (tagMapping[tag]) { tag = tagMapping[tag] };
            a[tag] = data;
            return a;
        }, {});
        orderedEvents.push(flattened);
    }

    return orderedEvents.sort((a, b) => {
        const aDate = new Date(a.dtstart).getTime();
        const bDate = new Date(b.dtstart).getTime();
        return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
    });
}
