﻿$(document).ready(function () {
    var evaluationStates = ['En curso', 'Esperando Cal Empleado', 'Esperando Cal Responsable', 'Esperando Cal Empresa', 'Lista para devolución', 'Abierta para devolución', 'Finalizada'];

    var CalificatorsManager = function (data) {
        var self = this;
        this.evaluation = '';
        this.calificators = ko.observableArray();
        this.newCalificator = ko.observable('');
        this.activeCalificators = ko.computed(function () {
            return _.filter(this.calificators(), function (e) {
                return e.action() !== 1;
            });
        }, this);
        this.saveButtonEnable = ko.observable(false);
        this.title = ko.computed(function () {
            return this.activeCalificators().length > 0 ? 'Editar Calificadores' : 'Agregar Calificadores';
        }, this);
        if (data) {
            this.fromJs(data);
        }
        this.onEnter = function (d, e) {
            if (e.keyCode === 13) {
                self.addCalificator();
            }
            return true;
        };
        this.addCalificator = function () {
            var userName = self.newCalificator();
            if (userName) {
                var calificator = _.find(self.calificators(), function (e) {
                    return e.userName == userName;
                }, this);
                if (calificator) {
                    calificator.action(0);
                } else {
                    var calificator = new Calificator();
                    calificator.add(userName);
                    self.calificators.push(calificator);
                }
                self.saveButtonEnable(true);
            }
            self.newCalificator('');
        }
        this.removeCalificator = function () {
            if (this.action() === 0) {
                self.calificators.remove(this);
            } else {
                this.action(1);
            }
            self.saveButtonEnable(true);
        }
        this.close = function () {
            $('.content-evaluation').append($('.content-modal'));
            $('.content-modal').hide();
            self.saveButtonEnable(false);
        }
        this.save = function () {
            var updateCalificators = this.calificatorsManagerModel.toJs();
            $.ajax("/Evaluations/api/UpdateCalificators/", {
                type: "POST",
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(updateCalificators),
                complete: function (response) {
                    self.close();
                    self.saveButtonEnable(false);
                    getDashboardEvaluations();
                }
            });
        }
    }

    CalificatorsManager.prototype.fromJs = function (data) {
        var self = this;
        this.evaluation = data.evaluation;
        this.calificators(_.map(data.calificators, function (e) {
            return new Calificator(e);
        }));
    }

    CalificatorsManager.prototype.toJs = function () {
        var calificators = _.map(this.calificators(), function (e) {
            return e.toJs();
        });
        var calificatorsFiltered = _.filter(calificators, function (e) {
            return e.Action !== '';
        });

        return {
            Evaluation: this.evaluation.toJs(),
            Calificators: calificatorsFiltered
        };
    }

    var Calificator = function (data) {
        this.userName = '';
        this.action = ko.observable();
        if (data) {
            this.fromJs(data);
        }
    }

    Calificator.prototype.fromJs = function (data) {
        this.userName = data;
        this.action('');
    }

    Calificator.prototype.add = function (data) {
        this.userName = data;
        this.action(0);
    }

    Calificator.prototype.remove = function () {
        this.action(1);
    }

    Calificator.prototype.toJs = function () {
        return {
            UserName: this.userName,
            Action: this.action()
        };
    }

    var Dashboard = function (data) {
        this.evaluations = ko.observableArray();
        this.calificatorsManagerModel = new CalificatorsManager();
        if (data) {
            this.fromJS(data);
        }
    }

    Dashboard.prototype.fromJS = function (data) {
        var self = this;
        this.evaluations(_.map(data.Evaluations, function (e) {
            return new Evaluation(e);
        }));
    }

    Dashboard.prototype.toJs = function () {
        return {
            Evaluations: _.map(this.evaluations(), function (e) {
                return e.toJs();
            })
        }
    }
    Dashboard.prototype.getEvaluationState = function (state) {
        return this.evaluationStates[state];
    }

    var Evaluation = function (data) {
        this.idResponsible = '';
        this.fullName = '';
        this.userName = '';
        this.period = '';
        this.currentPosition = '';
        this.seniority = '';
        this.evaluatorsAmount = '';
        this.evaluatorsString = '';
        this.state = '';
        this.currentState = '';
        this.evaluators = '';
        if (data) {
            this.fromJs(data);
        }
    }

    Evaluation.prototype.fromJs = function (data) {
        this.isResponsible = data.IsResponsible;
        this.fullName = data.FullName;
        this.userName = data.UserName;
        this.period = data.Period;
        this.currentPosition= data.CurrentPosition;
        this.seniority = data.Seniority;
        this.evaluators = data.Evaluators;
        this.evaluatorsString = ko.computed(function () {
            return this.evaluators.toString().replace(/,/g, ', ');
        }, this);
        this.evaluatorsAmount = ko.computed(function () {
            return this.evaluators.length;
        }, this);
        this.evaluatorsTextLink = ko.computed(function () {
            return (this.evaluatorsAmount() === 1) ? this.evaluatorsAmount() + " calificador" : this.evaluatorsAmount() + " calificadores";
        }, this);
        this.state = data.State;
        this.stateName = evaluationStates[this.state];
        this.stateClasses = "state-doc state-" + this.state;
        this.isCalificatorsEditable = ko.computed(function () {
            return this.isResponsible && this.state != 6;
        }, this);
        this.calificationActionTooltip = ko.computed(function () {
            switch (this.state) {
                case 0:
                case 2:
                    return "Calificar como responsable";
                case 1:
                case 3:
                    return "Calificar como empresa";
                default:
                    return "Ver Calificación";
            }
        }, this);
        this.calificationActionText = ko.computed(function () {
            switch (this.state) {
                case 0:
                case 1:
                case 2:
                case 3:
                    return "Calificar";
                default:
                    return "Ver Calificación";
            }
        }, this);
        this.calificationActionClass = ko.computed(function () {
            switch (this.state) {
                case 0:
                case 2:
                    return "icon user";
                case 1:
                case 3:
                    return "icon empresa";
                default:
                    return "icon view";
            }
        }, this);
        this.showCalificatorsManager = function (data, event) {
            viewmodel.calificatorsManagerModel.fromJs({ evaluation: this, calificators: this.evaluators });
            var popupContainer = $(event.target).parents('.calificators-column');
            popupContainer.append($('.content-modal'));
            $('.content-modal').show();
            return true;
        }
    }

    Evaluation.prototype.toJs = function () {
        return {
            IsResponsible: this.isResponsible,
            FullName: this.fullName,
            CurrentPosition: this.currentPosition,
            Seniority: this.seniority,
            Evaluators: this.evaluators,
            State: this.state,
            UserName: this.userName,
            Period: this.period
        };
    }

    var viewmodel = new Dashboard();

    getDashboardEvaluations();
    ko.applyBindings(viewmodel);
    commonSuggest($('.content-modal .search'), 'UserName');
    

    function getDashboardEvaluations() {
        $.getJSON("/Evaluations/api/getDashboardEvaluations/", function (model) {
            viewmodel.fromJS(model);
        });
    }

});