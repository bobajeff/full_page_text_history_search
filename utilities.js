Array.prototype.start_at = function(at){
    let index = at -1;
    const array = this;
    return {
        next: function() {
            return {
                done: ++index >= array.length,
                value: array[index]
            }
        },[Symbol.iterator]: function() { return this; }
    };

}

Array.prototype.reverse_entries = function(){
    let index = this.length;
    const array = this;

        return {
            next: function() {
                return {
                    done: --index < 0,
                    value: [index, array[index]]
                }
            },[Symbol.iterator]: function() { return this; }
        }
    
};

