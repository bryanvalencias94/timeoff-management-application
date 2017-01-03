'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Companies',
      'date_format',
      {
        type         : Sequelize.STRING,
        allowNull    : false,
        defaultValue : 'YYYY-MM-DD',
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('Companies', 'date_format');
  }
};
