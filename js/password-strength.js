$(function () {
    const vm = new Vue({
        el: '#app',
        data: {
            password: '',
            result: null,
            crackTime: null,
            scoreNumber: null,
        },
        computed: {
            score() {
                if (this.scoreNumber < 2) {
                    return 'very weak';
                } else if (this.scoreNumber < 3) {
                    return 'weak';
                } else if (this.scoreNumber < 4) {
                    return 'good';
                } else {
                    return 'strong';
                }
            },
            scoreClass() {
                if (this.scoreNumber < 2) {
                    return 'text-danger';
                } else if (this.scoreNumber < 3) {
                    return 'text-warning';
                } else if (this.scoreNumber < 4) {
                    return 'text-info';
                } else {
                    return 'text-success';
                }
            },
            hasPassword() {
                return this.password != null && this.password != '';
            },
            suggestions() {
                if (!this.hasPassword || this.result == null || this.result.feedback == null ||
                    this.result.feedback.suggestions == null) {
                    return null;
                } else {
                    return this.result.feedback.suggestions;
                }
            },
            warning() {
                if (!this.hasPassword || this.result == null || this.result.feedback == null ||
                    this.result.feedback.warning == null) {
                    return null;
                } else {
                    return this.result.feedback.warning;
                }
            },
        },
        watch: {
            async password(newValue) {
                this.test();
            },
        },
        methods: {
            test() {
                const self = this;
                self.result = zxcvbn(self.password, ['bitwarden', 'bit', 'warden']);
                if (self.result != null) {
                    self.crackTime = self.result.crack_times_display.offline_slow_hashing_1e4_per_second;
                    self.scoreNumber = self.result.score;
                } else {
                    self.scoreNumber = null;
                    self.crackTime = null;
                }
            },
        },
    });

    vm.test();
});

