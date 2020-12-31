const lang = navigator.language;
const full_date = new Intl.DateTimeFormat(lang, { dateStyle: 'full'}).format;
const shortTime = new Intl.DateTimeFormat(lang, {timeStyle: 'short' }).format;
const todays_date = new Date();
const todays_date_string = full_date(todays_date);

function getDate(timestamp){
    let date = new Date(timestamp);
    let date_string = full_date(date);
    if (todays_date_string === date_string)
    {
        return shortTime(date);
    }
    else
    {
        return date_string;
    }
}

export default getDate;