// components/toast/toast.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    message: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'info' // success | error | warning | info
    },
    duration: {
      type: Number,
      value: 1500
    }
  },

  observers: {
    'visible'(val) {
      if (val) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  },

  methods: {
    startTimer() {
      this.clearTimer();

      this.timer = setTimeout(() => {
        this.triggerEvent('hide');
      }, this.data.duration);
    },

    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  },

  detached() {
    this.clearTimer();
  }
});
