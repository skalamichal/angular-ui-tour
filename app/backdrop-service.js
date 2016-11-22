/*global angular: false*/
(function (app) {
    'use strict';

    app.factory('uiTourBackdrop', [
        'TourConfig', '$document', '$uibPosition', '$window', function (TourConfig, $document, $uibPosition, $window) {

            var service = {},
                $body = angular.element($document[0].body),
                viewWindow = {
                    top: angular.element($document[0].createElement('div')),
                    bottom: angular.element($document[0].createElement('div')),
                    left: angular.element($document[0].createElement('div')),
                    right: angular.element($document[0].createElement('div')),
                    overlay: angular.element($document[0].createElement('div'))
                },
                preventDefault = function (e) {
                    e.preventDefault();
                },
                onResize;

            (function createNoScrollingClass() {
                var name = '.no-scrolling',
                    rules = 'height: 100%; overflow: hidden;',
                    style = $document[0].createElement('style');
                style.type = 'text/css';
                $document[0].getElementsByTagName('head')[0].appendChild(style);

                if (!style.sheet && !style.sheet.insertRule) {
                    (style.styleSheet || style.sheet).addRule(name, rules);
                }
                else {
                    style.sheet.insertRule(name + '{' + rules + '}', 0);
                }
            }());

            function preventScrolling() {
                $body.addClass('no-scrolling');
                $body.on('touchmove', preventDefault);
            }

            function allowScrolling() {
                $body.removeClass('no-scrolling');
                $body.off('touchmove', preventDefault);
            }

            function createBackdropComponent(backdrop) {
                backdrop.addClass('tour-backdrop').css({
                    display: 'none',
                    zIndex: TourConfig.get('backdropZIndex')
                });
                $body.append(backdrop);
            }

            function createOverlayComponent(element) {
                element.addClass('tour-overlay').css({
                    display: 'none',
                    zIndex: TourConfig.get('backdropZIndex'),
                    'pointer-events': 'none'
                });
                $body.append(element);
            }

            function showBackdrop(orphan) {
                viewWindow.top.css('display', 'block');
                viewWindow.bottom.css('display', 'block');
                viewWindow.left.css('display', 'block');
                viewWindow.right.css('display', 'block');
                if (!orphan) {
                    viewWindow.overlay.css('display', 'block');
                }
            }

            function hideBackdrop() {
                viewWindow.top.css('display', 'none');
                viewWindow.bottom.css('display', 'none');
                viewWindow.left.css('display', 'none');
                viewWindow.right.css('display', 'none');
                viewWindow.overlay.css('display', 'none');
            }

            function positionBackdrop(elements, isFixedElement, margin) {
                var position,
                    viewportPosition,
                    bodyPosition,
                    vw = Math.max($document[0].documentElement.clientWidth, $window.innerWidth || 0),
                    vh = Math.max($document[0].documentElement.clientHeight, $window.innerHeight || 0),
                    defPosition = {top: 10000, left: 10000, right: 0, bottom: 0},
                    defViewportPosition = {top: 10000, left: 10000, right: 10000, bottom: 10000};

                position = elements.reduce(function (prev, current) {
                    var pos = $uibPosition.offset(current);
                    return prev ? {
                        top: Math.min(prev.top, pos.top),
                        left: Math.min(prev.left, pos.left),
                        bottom: Math.max(prev.bottom, pos.top + pos.height),
                        right: Math.max(prev.right, pos.left + pos.width)
                    } : pos;
                }, defPosition);
                viewportPosition = elements.reduce(function (prev, current) {
                    var pos = $uibPosition.viewportOffset(current);
                    return prev ? {
                        top: Math.min(prev.top, pos.top),
                        left: Math.min(prev.left, pos.left),
                        bottom: Math.min(prev.bottom, pos.bottom),
                        right: Math.min(prev.right, pos.right)
                    } : pos;
                }, defViewportPosition);

                // update position
                position.width = position.right - position.left;
                position.height = position.bottom - position.top;
                // append the margin
                position = {
                    top: position.top - margin,
                    left: position.left - margin,
                    width: position.width + margin * 2,
                    height: position.height + margin * 2
                };

                bodyPosition = $uibPosition.offset($body);

                if (isFixedElement) {
                    angular.extend(position, viewportPosition);
                }

                viewWindow.top.css({
                    position: isFixedElement ? 'fixed' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: position.top + 'px'
                });
                viewWindow.bottom.css({
                    position: isFixedElement ? 'fixed' : 'absolute',
                    left: 0,
                    width: '100%',
                    height: Math.max(bodyPosition.top + bodyPosition.height - position.top - position.height,
                        vh - position.top - position.height) + 'px',
                    top: (position.top + position.height) + 'px'
                });
                viewWindow.left.css({
                    position: isFixedElement ? 'fixed' : 'absolute',
                    top: position.top + 'px',
                    width: position.left + 'px',
                    height: position.height + 'px'
                });
                viewWindow.right.css({
                    position: isFixedElement ? 'fixed' : 'absolute',
                    top: position.top + 'px',
                    width: Math.max(bodyPosition.left + bodyPosition.width - position.left - position.width,
                        vw - position.left - position.width) + 'px',
                    height: position.height + 'px',
                    left: (position.left + position.width) + 'px'
                });
                viewWindow.overlay.css({
                    position: isFixedElement ? 'fixed' : 'absolute',
                    top: position.top + 'px',
                    height: position.height + 'px',
                    left: position.left + 'px',
                    width: position.width + 'px'
                });
            }

            /**
             * Find the parent table element for any table cell, row element
             * @param element
             * @returns {*}
             */
            function getTable(element) {
                var parent = element[0];
                while (parent) {
                    parent = parent.parentNode;
                    if (parent.tagName.toLowerCase() === 'table') {
                        return parent;
                    }
                }
                return undefined;
            }

            /**
             * Return all td elements in current column, including the input element
             * @param element
             * @returns {Array.<*>}
             */
            function getTableColumn(element) {
                var index = Array.prototype.indexOf.call(element[0].parentNode.children, element[0]),
                    table = getTable(element),
                    cellsInColumn, cells = [];

                cellsInColumn = table.querySelectorAll(['tbody > tr > td:nth-child(', index + 1, ')'].join(''));

                for (index = 0; index < cellsInColumn.length; index++) {
                    cells.push(angular.element(cellsInColumn[index]));
                }

                return cells;
            }

            /**
             * Return all siblings by given name
             * @param element
             * @param byName
             * @return {Array}
             */
            function getNamedElements(element, byName) {
                var children = element.parent().children(),
                    elements = [];

                angular.forEach(children, function (child) {
                    var elm = angular.element(child);
                    if (elm.attr('name') === byName) {
                        elements.push(elm);
                    }
                });

                return elements;
            }

            createBackdropComponent(viewWindow.top);
            createBackdropComponent(viewWindow.bottom);
            createBackdropComponent(viewWindow.left);
            createBackdropComponent(viewWindow.right);
            createOverlayComponent(viewWindow.overlay);

            service.createForElement = function (element, shouldPreventScrolling, isFixedElement, isTableColumn, margin,
                                                 orphan, byName) {
                var tableElements = isTableColumn ? getTableColumn(element) : [],
                    namedElements = byName ? getNamedElements(element, byName) : [],

                    elements = [element].concat(tableElements).concat(namedElements);

                positionBackdrop([].concat(elements), isFixedElement, margin);
                showBackdrop(orphan);

                onResize = function () {
                    positionBackdrop([].concat(elements), isFixedElement, margin);
                };
                angular.element($window).on('resize', onResize);

                if (shouldPreventScrolling) {
                    preventScrolling();
                }
            };

            service.update = function() {
                onResize();
            };

            service.hide = function () {
                hideBackdrop();
                allowScrolling();
                angular.element($window).off('resize', onResize);
            };

            return service;

        }
    ]);

}(angular.module('bm.uiTour')));
