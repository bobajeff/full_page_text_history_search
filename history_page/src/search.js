var index;
export async function initIndex(){
    console.log('[no op]');
    // let response = await fetch('./key.json');
    // let {apiKey} = await response.json();
    // let client = new MeiliSearch({
    //     host: "http://127.0.0.1:7700/",
    //     apiKey: apiKey
    //   });
    
    // index = await client.getIndex("pages");
}

var lastsearch = "";
var offset = 0;

export function highlightTokens(hit){
  const character_limit = 140;
  var text = hit.text;
  var substrings_info = [];
  var elements = [];
  if (!!hit._matchesInfo && !!hit._matchesInfo.text && !!hit._matchesInfo.text.length)
  {
    hit._matchesInfo.text.forEach((match)=>{
            var{start, length} = match;
            
            
            if(length < character_limit) //Check if matched text take up character limit
            {
                let context = character_limit - length;
                var context_limit = Math.floor(context / 2);
                // var begin = start - context_limit;
                //begin context
                
                //check that there is a previous substring info entry
                if (substrings_info.length !== 0)
                {
                    var previous_substring_info_index = substrings_info.length -1;
                    const begin = start - context_limit;
                    //check if the begin context overlaps the previous substring
                    if (begin < substrings_info[previous_substring_info_index].end)
                    {
                        //if previous substring overlaps make don't bother with beginning context
                        if (!substrings_info[previous_substring_info_index].highlighted)
                        {
                            
                            substrings_info[previous_substring_info_index].end = start;
                            substrings_info[previous_substring_info_index].end_elipses = false;
                            
                        }
                        else //if not just change the begin to start at the previous end
                        {
                            substrings_info.push({begin: substrings_info[previous_substring_info_index].end, end: start});
                            substrings_info[previous_substring_info_index].end_elipses = false;
                        }
                    }
                    //check if the begin context underflows the string
                    else if (begin <= 0 )
                    {
                        substrings_info.push({begin: 0, end: start});
                    }
                    else
                    {
                        substrings_info.push({begin: begin, end: start}); // in this case we wont need the elipses since the previous snippet ha one
                    }

                }
                else //if no previous substring info entry 
                {
                    var begin = start - context_limit;
                    //check if the begin context underflows the string
                    if (begin <= 0 )
                    {
                        substrings_info.push({begin: 0, end: start});
                    }
                    else
                    {
                        substrings_info.push({begin: begin, end: start, begin_elipses: true});
                    }
                }


                //highlighted
                substrings_info.push({begin: start, end: start+length, highlighted: true});


                //end_context
                const cut_off = start+length+context_limit;
                //check if cut_off is more than string length
                if (cut_off > (text.length -1))
                {
                    //if it is use the string lenth as cutoff
                    substrings_info.push({begin: start+length, end: (text.length -1)});
                }
                else
                {
                    substrings_info.push({begin: start+length, end: cut_off, end_elipses: true});
                }
            }
            else //if matched text is over character limit don't bother with context
            {
                //no context budget left
                //highlighted
                if (substrings_info.length !== 0)
                {
                    var previous_substring_info_index = substrings_info.length -1;
                    if (start === substrings_info[previous_substring_info_index].end)
                    {
                        substrings_info.push({begin: start, end: start+length, highlighted: true, end_elipses: true});
                    }
                    else
                    {
                        substrings_info.push({begin: start, end: start+length, highlighted: true, begin_elipses: true, end_elipses: true});
                    }
                }
                else
                {
                    substrings_info.push({begin: start, end: start+length, highlighted: true, end_elipses: true, begin_elipses: true});
                }
            }
    });

    substrings_info.forEach((substring_info)=>{
        let {begin, end} = substring_info;
        if (!!substring_info.begin_elipses)
        {
            elements.push(<em>...</em>);
        }
        if ((!!substring_info.highlighted))
        {
            elements.push(<mark>{text.substring(begin, end)}</mark>);
        }
        else
        {
          elements.push(text.substring(begin, end));
        }
        if (!!substring_info.end_elipses)
        {
            elements.push(<em>...</em>);
        }
    });
    return elements;
  }
  else
  {
    return "";
  }
}

async function Search(searchtext){
    if (!index)
    {
        await initIndex();
    }
    
    async function searchWithMeili(searchtext) {
        offset = 0;
        lastsearch = searchtext;
        // var searchfilter = {
        //   matches: true
        // }
        let hits = [];//missing op
        console.log('[missing op]');
    //   const search = await index.search(searchtext, searchfilter);
        return hits;
    }
    let results = await searchWithMeili(searchtext);
    
    

      return results;
}

export async function LoadMoreHits()
{
    // var searchfilter = {
    //     matches: true,
    //     offset: offset
    //   }
    let hits = []; //missing op
      console.log('[missing op]');
    // const results = await index.search(lastsearch, searchfilter);
    offset = offset + 20;
    if (hits.length !== 0)
    {
        return hits;
    }
    else
    {
        return 0;
    }

}

export default Search;