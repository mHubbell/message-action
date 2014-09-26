/**
 * $.messageAction
 * 
 * This plugin is for displaying various types of messages across an app in a
 * uniform fashion. These message items can be hooked to various callbacks on
 * actions such as execute and undo. Execute methods will be executed on items
 * upon either another message being added or when the window/document
 * dispatches one of a set of "Im leaving" events (beforeunload unload
 * pjax:start). It should be initialized and stored in some globally accessible
 * namespace so it can act as a singleton message display utility across an
 * entire SPA.
 * 
 * Use of this plugin enables various client side interactions to appear
 * instantaneous as the actual execution of whatever action the user intended can 
 * be deferred until the message is either ignored or acted on directly.
 * 
 * Example: Ss.plugins.messageAction = $.messageAction({ fadeDelay:2000 });
 * 
 * Then to use someplace: Ss.plugins.messageAction.addUndoItem({ message:
 * 'Something was removed.', onExecute: function() { // actually delete the
 * thing }, onUndo: function() { // never mind.. bring back the ui element } });
 */
(function($) {

    /**
     * Defaults
     */
    var defaults = {
        messageContainer : '#message-action-container',
        autoExecuteDocEvents : 'pjax:start',
        autoExecuteWinEvents : 'beforeunload unload',
        messageTemplate : '#message-button-template',
        fadeDelay : "fast",
        phrases : {
            undo : "Undo"
        }
    };

    /**
     * Constructor
     */
    function MessageAction(options) {
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this.init();
    }

    /**
     * Init
     */
    MessageAction.prototype.init = function() {
        // store references
        this.$messageContainer = $(this.options.messageContainer);
        this.$messageTemplate = $(this.options.messageTemplate);
        // listen for document and window events that should execute the undo
        // TODO :: see if pjax:start will bubble from window so we can do just
        // one target here...
        var plugin = this;
        $(document).on(this.options.autoExecuteDocEvents, function() {
            plugin.execute();
        });
        $(window).on(this.options.autoExecuteWinEvents, function() {
            plugin.execute();
        });
    };

    /**
     * Add a message item to be displayed. You can use this method directly if
     * you define the entire message item you want to display, or use shortcut
     * methods below (addUndoItem)
     */
    MessageAction.prototype.addMessageItem = function(item) {
        // call execute to clear any hanging message and execute its action if
        // any
        this.execute();
        // store the item and display
        this.messageItem = item;
        this.displayMessage();
    };

    /**
     * Add an undo item ( shortcut to addMessageItem )
     */
    MessageAction.prototype.addUndoItem = function(item) {
        item.messageClass = item.messageClass ? item.messageClass : 'alert-success';
        item.actions = [ {
            type : 'undo',
            label : this.options.phrases.undo
        } ];
        this.addMessageItem(item);
    };

    /**
     * Display an undo message / button based on the current undo item
     */
    MessageAction.prototype.displayMessage = function() {
        // display an undo message / button at the top of the specified
        // container
        var messageTemplate = swig.render(this.$messageTemplate.html(), {
            locals : this.messageItem
        });
        this.$message = $(messageTemplate);
        this.$message.css('opacity', 0);
        this.$messageContainer.append(this.$message);
        this.$message.fadeTo(this.options.fadeDelay, 1);
        // listen for clicks on the various types of action buttons
        this.$actionButtons = this.$message.find('button');
        var plugin = this;
        if (this.$actionButtons.length) {
            this.$actionButtons.on('click', function() {
                plugin.handleActionClick($(this));
            });
        }
    };

    /**
     * Handle a click on an action button to perform a message action
     */
    MessageAction.prototype.handleActionClick = function($button) {
        switch ($button.data('action-type')) {
        case 'undo':
            this.undo();
            break;
        case 'execute':
            this.execute();
            break;
        }
    };

    /**
     * Execute the item's undo method
     */
    MessageAction.prototype.undo = function() {
        if (this.messageItem) {
            if ($.isFunction(this.messageItem.onUndo)) {
                this.messageItem.onUndo.call(this);
            }
        }
        this.clearMessage();
    };

    /**
     * Execute the item's execute method
     */
    MessageAction.prototype.execute = function() {
        if (this.messageItem) {
            if ($.isFunction(this.messageItem.onExecute)) {
                this.messageItem.onExecute.call(this);
            }
        }
        this.clearMessage();
    };

    /**
     * Clear out any current message
     */
    MessageAction.prototype.clearMessage = function() {
        // unlisten actions and fade out
        if (this.$actionButtons && this.$actionButtons.length) {
            this.$actionButtons.off();
        }
        if (this.$message) {
            this.$message.fadeOut(this.options.fadeDelay, function() {
                $(this).remove();
            });
        }
        // clear out message container just in case
        this.$messageContainer.html('');
        // nullify undo item so it doesnt linger
        this.messageItem = null;
    };

    /**
     * Destroy
     */
    MessageAction.prototype.destroy = function() {
        this.clearMessage();
    };

    /**
     * Add to jquery, enforcing as a singleton
     */
    $.messageAction = function(options) {
        if (!$('html').data('ss_messageAction')) {
            $('html').data('ss_messageAction', new MessageAction(options));
        }
        return $('html').data('ss_messageAction');
    };

})(jQuery);