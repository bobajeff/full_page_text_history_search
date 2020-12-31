const TrackScroll = (props) => {
    const styles = {
      position: 'absolute',
      width: "100%",
      height:"100%",
      'overflow-y':'scroll',
      'overflow-x':'hidden'
  };
    
     const scrollEvent = (e) => { 
       let height_offset = e.target.clientHeight; //the height of the scroll viewport
       let endpoint = e.target.scrollHeight - height_offset; //the scrolltop position at the end
       let trigger = endpoint * .95; //the point which I want to trigger the scroll end event
       if (e.target.scrollTop >= trigger)
       {
        props.onScrollEnd();
       }
     }
  
    
    return (<div ref={props.refprop} style={styles} 
              onScroll={scrollEvent}>
  {props.children}
    </div>)
  }

  export default TrackScroll;