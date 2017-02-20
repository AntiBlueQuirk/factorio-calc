/* global App, _*/

App.Calculator = {

	calculateAndAnalyze: function(recipeName, ips, options) {
		var recipe = this._getRecipeTree(recipeName, ips);
		this._addAnalyis(recipe, options);

		var totals = this._getRecipeTreeTotals(recipe);
		var self = this;	
		totals.forEach(function (total) {
			self._addAnalyis(total, options);
		});

		return {recipe: recipe, totals: totals};
	},

	_addAnalyis: function(recipe, options) {
		var assemblyInfo = this._getAssemblyInfoForRecipe(recipe, options);
		var assemblyLineInfo = this._getAssemblyLinesInfoForRecipe(recipe, assemblyInfo, options);
		_.defaults(recipe, assemblyInfo);
		_.defaults(recipe, assemblyLineInfo);
		var self = this;
		(recipe.ingredients || []).forEach(function(ingredient) {
			self._addAnalyis(ingredient.recipe, options);
		});
	},

	_asArray: function(object) {
		return _.isArray(object) ? object: [];
	},


	_getRecipe: function(name) {
		var rawData = App.getRawRecipe.call(name);

		if (name == "iron-ore" || name == "copper-ore") {
			rawData = {};
			rawData.name = name;
			rawData.energy_required = 1 / 0.525;
			rawData.category = "ore";
			rawData.ingredients = [];
		}

		var recipe = {};
		if (!rawData) {
			console.log("No data found for " + name);
			return {
				name: name,
				category: "unknown",
				ingredients: []
			};
		}
		recipe.name = rawData.name;
		recipe.baseTime = rawData.energy_required || 0.5;
		recipe.category = rawData.category;

		if (rawData.results) {
			var selfResult = _.findWhere(rawData.results, {name: recipe.name});
			recipe.outputs = selfResult ? selfResult.amount : 1;
		} else {
			recipe.outputs = rawData.result_count || 1;
		}

		recipe.ingredients = this._asArray(rawData.ingredients).map(function(rawIngredient) {
			if (rawIngredient.name) {
				return {name: rawIngredient.name, amount: rawIngredient.amount};
			} else {
				return {name: rawIngredient[0], amount: rawIngredient[1]};
			}
		});
	
		return recipe;
	},

	_getRecipeTree: function(name, ips) {
		var recipe = this._getRecipe(name);
		recipe.ips = ips;
		var self = this;
		recipe.ingredients.forEach(function(ingredient) {
			var ingredientIps = recipe.ips / recipe.outputs * ingredient.amount;
			ingredient.recipe = self._getRecipeTree(ingredient.name, ingredientIps);
		});

		return recipe;
	},

	_getRecipeTreeTotals: function(recipe) {
		var self = this;
		var allSubtotals = _.flatten(_.map(recipe.ingredients, function(ingredient) {
			return self._getRecipeTreeTotals(ingredient.recipe);
		}));
		allSubtotals.unshift(recipe);
		var groupedSubtotals = _.groupBy(allSubtotals, "name");

		var finalTotals = _.map(groupedSubtotals, function(subtotalsForName, name) {
			var total = _.clone(subtotalsForName[0]);
			delete total.ingredients;
			total.ips = _.sum(subtotalsForName, "ips");

			return total;
		});

		return finalTotals;
	},

	_getAssemblyInfoForRecipe: function(recipe, options) {

		var assemblyTime;

		if (recipe.category == 'smelting') {
			assemblyTime = recipe.baseTime / parseFloat(options.smeltlvl);
		}
		else if (recipe.category == 'chemistry') {
			assemblyTime = recipe.baseTime / 1.25;
		}
		else if (recipe.category == 'ore') {
			assemblyTime = recipe.baseTime;
		}
		else {
			assemblyTime = recipe.baseTime / parseFloat(options.asslvl);
		}

		var oneAssemblerRate = recipe.outputs / assemblyTime;
		var assembersRequired = recipe.ips / oneAssemblerRate

		return {assemblersRequired: assembersRequired, assemblyTime: assemblyTime, oneAssemblerRate: oneAssemblerRate};
	},

	_getAssemblyLinesInfoForRecipe: function(recipe, assemblyInfo, options) {

		var assemblersPerLine = parseFloat(options.beltlvl) * assemblyInfo.assemblyTime / recipe.outputs;
		var lines = assemblyInfo.assemblersRequired / assemblersPerLine;

		return {assemblersPerLine: assemblersPerLine, lines: lines};
	}

};