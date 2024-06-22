/**
 * SPECIAL calculator
 * Version 2.0
 */

(function () {
  var SpecialCalculator;

  SpecialCalculator = (function () {
    var Perk;

    /**
     * CSS class to be applied to available perks
     * @type {string}
     */
    SpecialCalculator.availablePerkClass = 'info';

    /**
     * URL of the calculator page
     * @type {string}
     */
    SpecialCalculator.baseUrl =
      'https://web.archive.org/web/20171012002142/http://www.levelbased.com/guides/fallout-4/tools/special';

    /**
     * @constructor
     */
    function SpecialCalculator(perksData) {
      this.special = { s: 1, p: 1, e: 1, c: 1, i: 1, a: 1, l: 1 };
      this.specialAllocated = 0;
      this.perks = {};
      this.perksAllocated = 0;

      for (var specialType in perksData) {
        var specialPerks = perksData[specialType];

        for (var specialValue in specialPerks) {
          var perkId = specialType + specialValue;
          var perkName = specialPerks[specialValue].name;
          var perkRankData = specialPerks[specialValue].ranks;
          var perk = new Perk(perkId, perkName, perkRankData);
          this.perks[perkId] = perk;
          var ol = $('<ol></ol>');
          for (var i = 0; i < perk.ranks.length; ++i) {
            var li = $('<li></li>');
            li.html(perk.ranks[i].description);
            ol.append(li);
          }
          if ($(window).width() > 780) {
            $('.perk-name[data-perk="' + perkId + '"]')
              .text(perkName)
              .attr('href', specialPerks[specialValue].url)
              .tooltip({ html: true, title: ol });
          } else {
            $('.perk-name[data-perk="' + perkId + '"]')
              .text(perkName)
              .tooltip({ html: true, title: ol });
          }
        }
      }
    }

    SpecialCalculator.prototype.getRequiredLevel = function () {
      //Was Returning Wrong Level on Load
      //            if (this.perksAllocated == 0) {
      //               if (this.specialAllocated <= 21) {
      //                   return 1;
      //                }
      //
      //                return this.specialAllocated - 20;
      //            }

      var levelForSpecial;

      if (this.specialAllocated < 21) {
        levelForSpecial = 0;
      } else {
        levelForSpecial = this.specialAllocated - 20;
      }

      var levelForAllocated = levelForSpecial + this.perksAllocated;

      var levelForPerks = 0;

      for (var perkId in this.perks) {
        var perk = this.perks[perkId];

        if (perk.rankNumber > 0) {
          var rank = perk.ranks[perk.rankNumber - 1];

          if (rank.level > levelForPerks) {
            levelForPerks = rank.level;
          }
        }
      }

      if (levelForAllocated > levelForPerks) {
        return levelForAllocated;
      } else {
        return levelForPerks;
      }
    };

    /**
     * Gets the calculated Hit Points value
     * @returns {number}
     */
    SpecialCalculator.prototype.getHitPoints = function () {
      return 80 + this.special.e * 5;
    };

    /**
     * Gets the calculated Action Points value
     * @returns {number}
     */
    SpecialCalculator.prototype.getActionPoints = function () {
      return 60 + this.special.a * 10;
    };

    /**
     * Gets the calculated Carry Weight value
     * @returns {number}
     */
    SpecialCalculator.prototype.getCarryWeight = function () {
      return 200 + this.special.s * 10;
    };

    /**
     * Gets the URL for the current build
     * @returns {string}
     */
    SpecialCalculator.prototype.getBuildUrl = function () {
      var specialKeys = ['s', 'p', 'e', 'c', 'i', 'a', 'l'];

      var buildFlags = 0;
      var buildString = '';

      var partString;

      for (var i = 0; i < specialKeys.length; ++i) {
        partString = '';

        var specialFlag = 0;
        var specialType = specialKeys[i];
        var specialValue = this.special[specialType];

        if (specialValue > 1) {
          specialFlag = 1;
          partString = toHexString(specialValue);
        }

        for (var j = 1; j <= specialValue; ++j) {
          var perk = this.getPerk(specialType + j);

          if (perk.rankNumber > 0) {
            specialFlag += Math.pow(2, j);
            partString += toHexString(perk.rankNumber);
          }
        }

        if (specialFlag > 0) {
          buildFlags += Math.pow(2, i);

          if (specialFlag == 1) {
            buildString += '.' + toHexString(specialValue);
          } else {
            buildString += toHexString(specialFlag, 3, '!') + partString;
          }
        }
      }

      if (buildFlags == 0) {
        return SpecialCalculator.baseUrl;
      }

      return (
        SpecialCalculator.baseUrl +
        '?build=' +
        toHexString(buildFlags, 2) +
        buildString
      );

      return (
        SpecialCalculator.baseUrl +
        '?s=' +
        this.special.s +
        '&p=' +
        this.special.p +
        '&e=' +
        this.special.e +
        '&c=' +
        this.special.c +
        '&i=' +
        this.special.i +
        '&a=' +
        this.special.a +
        '&l=' +
        this.special.l
      );
    };

    /**
     * Loads the initial display and event handlers
     */
    SpecialCalculator.prototype.load = function () {
      var calc = this;

      calc.loadFromQueryString();
      calc.updateUrl();

      calc.updateSpecial();
      calc.updateRequirements();
      calc.updateDerivedStats();
      calc.updatePerks();

      $('.sub-special').on('click', function (event) {
        event.preventDefault();

        var specialType = $(this).data('special');
        var specialValue = calc.getSpecial(specialType);

        if (specialValue > 1) {
          calc.subSpecial(specialType);
          calc.removeInvalidPerks(specialType);
          calc.updateUrl();
        }

        $(this).blur();
      });

      $('.add-special').on('click', function (event) {
        event.preventDefault();

        var specialType = $(this).data('special');
        var specialValue = calc.getSpecial(specialType);

        if (specialValue < 10) {
          calc.addSpecial(specialType);
          calc.updateUrl();
        }

        $(this).blur();
      });

      $('.sub-perk').on('click', function (event) {
        event.preventDefault();

        var perkId = $(this).data('perk');

        if (calc.canSubPerkRank(perkId)) {
          calc.subPerkRank(perkId);
          calc.updateUrl();
        }

        $(this).blur();
      });

      $('.add-perk').on('click', function (event) {
        event.preventDefault();

        var perkId = $(this).data('perk');

        if (calc.canAddPerkRank(perkId)) {
          calc.addPerkRank(perkId);
          calc.updateUrl();
        }

        $(this).blur();
      });

      $('.reset-special').on('click', function (event) {
        event.preventDefault();
        calc.reset();
        calc.updateUrl();
        $(this).blur();
      });
    };

    /**
     * Loads initial special values from the query string
     */
    SpecialCalculator.prototype.loadFromQueryString = function () {
      var url = document.location.href;
      var queryStringStart = url.indexOf('?');

      if (queryStringStart > 0) {
        var queryString = url.substring(queryStringStart + 1);

        if (queryString.indexOf('build=') != 0) {
          this.loadFromLegacyQueryString(queryString);
          return;
        }

        var buildString = queryString.substring(6);

        if (buildString.length < 2) {
          return;
        }

        var specialKeys = ['s', 'p', 'e', 'c', 'i', 'a', 'l'];

        var buildFlags = parseInt(buildString.substr(0, 2), 16);

        if (isNaN(buildFlags)) {
          return;
        }

        var readerIndex = 2;

        for (var i = 0; i < specialKeys.length; ++i) {
          var flag = Math.pow(2, i);

          if ((buildFlags & flag) == flag) {
            var specialType = specialKeys[i];
            var specialFlags = 0;

            if (buildString[readerIndex] == '.') {
              readerIndex++;
              specialFlags = 1;
            } else {
              var result = buildString.substr(readerIndex, 3);
              readerIndex += 3;
              result = result.replace(/!/g, '');
              specialFlags = parseInt(result, 16);
            }

            if ((specialFlags & 1) == 1) {
              var specialValue = parseInt(buildString[readerIndex++], 16);

              if (specialValue >= 1 && specialValue <= 10) {
                this.special[specialType] = specialValue;
                this.specialAllocated += specialValue;
              }
            }

            for (var j = 1; j <= 10; ++j) {
              var perkFlag = Math.pow(2, j);

              if ((specialFlags & perkFlag) == perkFlag) {
                var perk = this.getPerk(specialType + j);
                var rankNumber = parseInt(buildString[readerIndex++], 16);

                if (rankNumber > 0 && rankNumber <= perk.maxRankNumber()) {
                  perk.rankNumber = rankNumber;
                  this.updatePerk(perk.id);
                }
              }
            }
          }
        }

        this.removeInvalidPerks();
      }
    };

    SpecialCalculator.prototype.loadFromLegacyQueryString = function (
      queryString
    ) {
      var queryStringParams = queryString.split('&');

      for (var i in queryStringParams) {
        var pair = queryStringParams[i].split('=');

        if (pair.length != 2) {
          continue;
        }

        var type = pair[0];
        var value = parseInt(pair[1]);

        if (isNaN(value) || !(type in this.special)) {
          continue;
        }

        if (value < 1) {
          value = 1;
        }

        if (value > 10) {
          value = 10;
        }

        this.special[type] = value;
        this.specialAllocated += value - 1;
      }
    };

    /**
     * Resets values to their defaults
     */
    SpecialCalculator.prototype.reset = function () {
      for (var specialType in this.special) {
        this.special[specialType] = 1;
        this.updateSpecial(specialType);

        for (var specialValue = 10; specialValue >= 1; --specialValue) {
          var perkId = specialType + specialValue;
          this.perks[perkId].rankNumber = 0;
          this.updatePerk(perkId);
        }
      }

      this.specialAllocated = 0;
      this.perksAllocated = 0;
      this.updateRequirements();
    };

    /**
     * Gets value of given special type
     * @param specialType
     * @returns {number}
     */
    SpecialCalculator.prototype.getSpecial = function (specialType) {
      return this.special[specialType];
    };

    /**
     * Sets value of given special type and updates display
     * @param specialType
     * @param specialValue
     */
    SpecialCalculator.prototype.setSpecial = function (
      specialType,
      specialValue
    ) {
      this.special[specialType] = specialValue;
      this.updateSpecial(specialType);
      this.updateDerivedStats();
      this.updatePerks(specialType);
    };

    SpecialCalculator.prototype.subSpecial = function (specialType, amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setSpecial(specialType, this.special[specialType] - amount);
      this.subSpecialAllocated(amount);
    };

    SpecialCalculator.prototype.addSpecial = function (specialType, amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setSpecial(specialType, this.special[specialType] + amount);
      this.addSpecialAllocated(amount);
    };

    /**
     * Sets the amount of special points allocated and updates requirements display
     * @param amount
     */
    SpecialCalculator.prototype.setSpecialAllocated = function (amount) {
      var current = this.specialAllocated;
      this.specialAllocated = amount;
      this.updateRequirements();

      var wentBelow21 = current >= 21 && amount < 21;

      if (wentBelow21 || (current < 21 && amount >= 21)) {
        if (wentBelow21) {
          this.removeInvalidPerks();
        }

        this.updatePerks();
      }
    };

    SpecialCalculator.prototype.subSpecialAllocated = function (amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setSpecialAllocated(this.specialAllocated - amount);
    };

    SpecialCalculator.prototype.addSpecialAllocated = function (amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setSpecialAllocated(this.specialAllocated + amount);
    };

    /**
     * Updates display of given special type (or all if no type given)
     * @param specialType
     */
    SpecialCalculator.prototype.updateSpecial = function (specialType) {
      if (specialType === undefined) {
        for (specialType in this.special) {
          this.updateSpecial(specialType);
        }
      } else {
        var specialValue = this.special[specialType];
        $('.special-value[data-special="' + specialType + '"]').text(
          specialValue
        );
        $('.sub-special[data-special="' + specialType + '"]').toggleClass(
          'disabled',
          specialValue == 1
        );
        $('.add-special[data-special="' + specialType + '"]').toggleClass(
          'disabled',
          specialValue == 10
        );
      }
    };

    /**
     * Updates display of remaining character creation points and minimum required level
     */
    SpecialCalculator.prototype.updateRequirements = function () {
      var showLevel = this.specialAllocated >= 21 || this.perksAllocated > 0;

      $('.minimum-level').toggleClass('hidden', !showLevel);
      $('.creation-points-remaining').toggleClass('hidden', showLevel);

      if (showLevel) {
        $('.minimum-level-value').text(this.getRequiredLevel());
      } else {
        $('.creation-points-remaining-value').text(21 - this.specialAllocated);
      }
    };

    /**
     * Updates display of derived stats
     */
    SpecialCalculator.prototype.updateDerivedStats = function () {
      $('.hp-value').text(this.getHitPoints());
      $('.ap-value').text(this.getActionPoints());
      $('.cw-value').text(this.getCarryWeight());
    };

    SpecialCalculator.prototype.getPerk = function (perkId) {
      if (arguments.length == 2) {
        perkId += arguments[1];
      }

      return this.perks[perkId];
    };

    SpecialCalculator.prototype.setPerkRank = function (perkId, rankNumber) {
      if (arguments.length == 3) {
        perkId += rank;
        rank = arguments[2];
      }

      this.perks[perkId].rankNumber = rankNumber;
      this.updatePerk(perkId);
    };

    SpecialCalculator.prototype.subPerkRank = function (perkId, amount) {
      if (amount === undefined) {
        amount = 1;
      }

      var perk = this.getPerk(perkId);

      this.setPerkRank(perkId, perk.rankNumber - amount);
      this.subPerksAllocated(amount);
    };

    SpecialCalculator.prototype.addPerkRank = function (perkId, amount) {
      if (amount === undefined) {
        amount = 1;
      }

      var perk = this.getPerk(perkId);

      this.setPerkRank(perkId, perk.rankNumber + amount);
      this.addPerksAllocated(amount);
    };

    SpecialCalculator.prototype.setPerksAllocated = function (amount) {
      this.perksAllocated = amount;
      this.updateRequirements();
    };

    SpecialCalculator.prototype.subPerksAllocated = function (amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setPerksAllocated(this.perksAllocated - amount);
    };

    SpecialCalculator.prototype.addPerksAllocated = function (amount) {
      if (amount === undefined) {
        amount = 1;
      }

      this.setPerksAllocated(this.perksAllocated + amount);
    };

    SpecialCalculator.prototype.canSubPerkRank = function (perkId) {
      if (arguments.length == 2) {
        perkId += arguments[1];
      }

      var perk = this.perks[perkId];

      return perk.rankNumber > 0;
    };

    SpecialCalculator.prototype.canAddPerkRank = function (perkId) {
      if (arguments.length == 2) {
        perkId += arguments[1];
      }

      var perk = this.perks[perkId];

      var specialType = perk.getSpecialType();
      var specialValue = perk.getSpecialValue();

      return (
        perk.rankNumber < perk.maxRankNumber() &&
        this.special[specialType] >= specialValue
      );
    };

    SpecialCalculator.prototype.removeInvalidPerks = function (specialType) {
      if (specialType === undefined) {
        for (specialType in this.special) {
          this.removeInvalidPerks(specialType);
        }
      } else {
        for (var specialValue = 10; specialValue >= 1; --specialValue) {
          var perkId = specialType + specialValue;

          var perk = this.getPerk(perkId);

          if (perk.rankNumber < 0 || perk.rankNumber > perk.maxRankNumber()) {
            this.subPerkRank(perkId, perk.rankNumber);
          }

          if (perk.rankNumber > 0 && this.special[specialType] < specialValue) {
            this.subPerkRank(perkId, perk.rankNumber);
          }
        }
      }

      this.updateRequirements();
    };

    SpecialCalculator.prototype.updatePerk = function (perkId) {
      if (arguments.length == 2) {
        perkId += arguments[1];
      }

      var perk = this.getPerk(perkId);

      var specialType = perk.getSpecialType();
      var specialValue = perk.getSpecialValue();

      $('.perk[data-perk="' + perkId + '"]').toggleClass(
        SpecialCalculator.availablePerkClass,
        this.special[specialType] >= specialValue
      );

      $('.perk-rank[data-perk="' + perkId + '"]').text(
        perk.rankNumber + '/' + perk.maxRankNumber()
      );

      var subPerkElement = $('.sub-perk[data-perk="' + perkId + '"]');
      var addPerkElement = $('.add-perk[data-perk="' + perkId + '"]');

      var canSubRank = this.canSubPerkRank(perkId);
      var canAddRank = this.canAddPerkRank(perkId);

      subPerkElement.toggleClass('disabled', !canSubRank);
      addPerkElement.toggleClass('disabled', !canAddRank);
    };

    SpecialCalculator.prototype.updatePerks = function (specialType) {
      if (specialType === undefined) {
        for (specialType in this.special) {
          this.updatePerks(specialType);
        }
      } else {
        for (var specialValue = 1; specialValue <= 10; ++specialValue) {
          this.updatePerk(specialType + specialValue);
        }
      }
    };

    /**
     * Updates the build link's href attribute and browser address (via HTML5 history API)
     */
    SpecialCalculator.prototype.updateUrl = function () {
      var url = this.getBuildUrl();

      $('a.build-link').attr('href', url);
      $('#buildUrl').val(url);

      if (
        history.replaceState &&
        document.location.href.indexOf(SpecialCalculator.baseUrl) == 0
      ) {
        history.replaceState(null, null, url);
      }
    };

    Perk = (function () {
      var Rank;

      function Perk(id, name, ranks) {
        this.id = id;
        this.name = name;
        this.ranks = [];
        for (var key in ranks) {
          var rankData = ranks[key];
          this.ranks.push(new Rank(key, rankData.level, rankData.description));
        }
        this.rankNumber = 0;
      }

      Perk.prototype.maxRankNumber = function () {
        return this.ranks.length;
      };

      Perk.prototype.getSpecialType = function () {
        return this.id.substring(0, 1);
      };

      Perk.prototype.getSpecialValue = function () {
        return this.id.substring(1);
      };

      Rank = (function () {
        function Rank(number, level, description) {
          this.number = number;
          this.level = level;
          this.description = description;
        }

        return Rank;
      })();

      return Perk;
    })();

    return SpecialCalculator;
  })();

  function toHexString(n, padding, padCharacter) {
    if (padding === undefined) {
      padding = 1;
    }

    if (padCharacter === undefined) {
      padCharacter = '0';
    }

    var result = Number(n).toString(16);

    while (result.length < padding) {
      result = padCharacter + result;
    }

    return result;
  }

  $.get('/source/scripts/perks.json', function (perkData) {
    var calc = new SpecialCalculator(perkData);
    calc.load();
  });
})();
