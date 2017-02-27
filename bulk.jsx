 /* global React,App,ReactModal,_*/

App.Bulk = React.createClass({

    getInitialState: function() {
      return {
        inputText: "",
        error: null
      };
    },

    onOpen: function() {
      var inputText = _.map(this.props.inputs, function(input) {
        return input.recipe + " " + input.ipm;
      }).join("\n");
      this.setState({inputText: inputText});
    },

    onChangeText: function(event) {
      this.setState({inputText: event.target.value});
    },

    onImport: function() {
      var inputText = this.state.inputText;
      var lines = inputText.split(/\n/);
      var errorAtLine = null;
      var recipes = _.filter(_.map(lines, function(line, index) {
        var trimmed = line.trim();
        if (trimmed === "") {
          return null; // ignore blank lines
        }
        var parts = trimmed.split(" ");
        if (parts.length != 2) {
          errorAtLine = index + 1;
          return null;
        }
        return {recipe: parts[0], ipm: parts[1]};
      }));
      if (errorAtLine) {
        this.setState({error: "Line " + errorAtLine + ": Input not in valid format"});
      } else {
        this.props.onImport(recipes);
      }
    },

    render: function() {

        var style = {
          content: {
            top: "100px",
            left: "50%",
            right: "auto",
            width: "800px",
            marginLeft: "-400px"
          }
        };

        var error;
        if (this.state.error) {
          error = (<div className="error">{this.state.error}</div>);
        } else {
          error = null;
        }
      
        var content = (
          <div className="bulkContent">
            <div className="title">Bulk import/export</div>
            <div>Enter recipes, one per line, separating the recipe and items per minute with whitespace.</div>
            <textarea value={this.state.inputText} onChange={this.onChangeText}/>
            {error}
            <button onClick={this.onImport}>Import</button>
          </div>
        );
        

        return (
          <ReactModal isOpen={!!this.props.bulkVisible} contentLabel="Recipe Explanation" onRequestClose={this.props.onRequestClose} onAfterOpen={this.onOpen} style={ style }>
            <a className="closeLink" href="#" onClick={this.props.onRequestClose}>Cancel</a>
            { content }
          </ReactModal>
        );
    }
});