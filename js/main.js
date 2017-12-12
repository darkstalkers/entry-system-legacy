'use strict';

$(function () {
  var DATABASE_NAME = 'apocalypse';
  var STORE_NAME = '1';
  var TEAM_ENTRY = true; // 現在はチーム戦のみ対応
  var TEAM_MEMBER_COUNT = 5;

  var CHARACTERS = [{
    id: 'anakaris',
    name: 'アナカリス',
    image: 'img_s_anakaris_50x50.jpg'
  }, {
    id: 'aulbath',
    name: 'オルバス',
    image: 'img_s_aulbath_50x50.jpg'
  }, {
    id: 'bishamon',
    name: 'ビシャモン',
    image: 'img_s_bishamon_50x50.jpg'
  }, {
    id: 'bulleta',
    name: 'バレッタ',
    image: 'img_s_bulleta_50x50.jpg'
  }, {
    id: 'demitri',
    name: 'デミトリ',
    image: 'img_s_demitri_50x50.jpg'
  }, {
    id: 'felicia',
    name: 'フェリシア',
    image: 'img_s_felicia_50x50.jpg'
  }, {
    id: 'gallon',
    name: 'ガロン',
    image: 'img_s_gallon_50x50.jpg'
  }, {
    id: 'jedah',
    name: 'ジェダ',
    image: 'img_s_jedah_50x50.jpg'
  }, {
    id: 'leilei',
    name: 'レイレイ',
    image: 'img_s_leilei_50x50.jpg'
  }, {
    id: 'lilith',
    name: 'リリス',
    image: 'img_s_lilith_50x50.jpg'
  }, {
    id: 'morrigan',
    name: 'モリガン',
    image: 'img_s_morrigan_50x50.jpg'
  }, {
    id: 'qbee',
    name: 'キュービー',
    image: 'img_s_qbee_50x50.jpg'
  }, {
    id: 'sasquatch',
    name: 'サスカッチ',
    image: 'img_s_sasquatch_50x50.jpg'
  }, {
    id: 'victor',
    name: 'ビクトル',
    image: 'img_s_victor_50x50.jpg'
  }, {
    id: 'zabel',
    name: 'ザベル',
    image: 'img_s_zabel_50x50.jpg'
  }];

  // ハッシュ作成
  var charas = {};
  CHARACTERS.forEach(function (chara) {
    charas[chara.id] = {
      name: chara.name,
      image: chara.image,
      count: 0
    };
  });

  // フォーム生成
  $('#template-team-member-form').tmpl({
    members: new Array(TEAM_MEMBER_COUNT)
  }).appendTo('.team-member-form');

  // 使用キャラ選択の作成
  var optionsHTML = '';
  for (var i = 0, len = CHARACTERS.length; i < len; i++) {
    var character = CHARACTERS[i];
    optionsHTML += '<option value="' + character.id + '">' + character.name + '</option>';
  }
  var $options = $(optionsHTML);
  $('select.characters').each(function (i, select) {
    $(select).append($options.clone());
  });

  // フォーム切替
  $('input[name=entry-type]').on('change', function () {
    if ($('#type-single').prop('checked')) {
      changeForm('single');
    } else {
      changeForm('team');
    }
  });

  var lastModifyEntryKey = '';

  // firebase
  var database = firebase.database();
  var ref = database.ref(DATABASE_NAME + '/' + STORE_NAME);
  var teamsRef = ref.child('teams');
  var singlesRef = ref.child('singles');
  var entries = {};

  // 設定
  var configRef = ref.child('config');
  var config;
  configRef.child('open');
  configRef.once('value', function (snapshot) {
    config = snapshot.val();
    if (!config) {
      config = {
        open: true,
        adminPass: 'e421b0ade1927b91fa41bfa2baf72eb5'
      };
      configRef.set(config);
    }
    configUpdated(config);
    configRef.on('value', function (snapshot) {
      config = snapshot.val();
      configUpdated(config);
    });
  });

  // 設定変更時
  function configUpdated(config) {
    if (config.open) {
      $('.entry-open').show();
      $('.entry-close').hide();
    } else {
      $('.entry-open').hide();
      $('.entry-close').show();
    }
  }

  // 追加
  var teamNo = 0;
  var teams = [];
  teamsRef.on('child_added', function (snapshot) {
    var team = snapshot.val();
    var key = snapshot.key;
    team.no = ++teamNo;
    team.key = key;
    $('#template-team').tmpl(toTemplateFormat(team, TEAM_MEMBER_COUNT)).fadeIn(1000).prependTo('#teams');

    entries[key] = team;
    addOption('#target-team', team.name, key, true);
    teams.push(team);
    teamUpdated(team);
  });
  var singles = [];
  singlesRef.on('child_added', function (snapshot) {
    var single = snapshot.val();
    var key = snapshot.key;
    single.key = key;
    $('#template-single').tmpl(toTemplateFormat(single, 1)).fadeIn(1000).prependTo('#singles');
    entries[key] = single;
    addOption('#target-single', single.members[0].name, key, true);
    singles.push(single);
    singleUpdated(single);
  });

  // 削除
  teamsRef.on('child_removed', function (snapshot) {
    var key = snapshot.key;
    $('#' + key).remove();
    removeOption('#target-team', key);
    delete entries[key];
    for (var i = 0, len = teams.length; i < len; i++) {
      if (teams[i].key === key) {
        teams.splice(i, 1);
        break;
      }
    }
    teamUpdated();
  });
  singlesRef.on('child_removed', function (snapshot) {
    var key = snapshot.key;
    $('#' + key).remove();
    removeOption('#target-single', key);
    delete entries[key];
    for (var i = 0, len = singles.length; i < len; i++) {
      if (singles[i].key === key) {
        singles.splice(i, 1);
        break;
      }
    }
    singleUpdated();
  });

  // 変更
  teamsRef.on('child_changed', function (snapshot, old) {
    var team = snapshot.val();
    var key = snapshot.key;
    team.no = entries[key].no;
    team.key = key;

    $('#' + key).replaceWith($('#template-team').tmpl(toTemplateFormat(team, TEAM_MEMBER_COUNT)).fadeIn(1000));

    entries[key] = team;
    changeOptionLabel('#target-team', team.name, key);
    for (var i = 0, len = teams.length; i < len; i++) {
      if (teams[i].key === key) {
        teams[i] = team;
        break;
      }
    }
    teamUpdated(team);
  });
  singlesRef.on('child_changed', function (snapshot, old) {
    var single = snapshot.val();
    var key = snapshot.key;
    single.key = key;
    $('#' + key).replaceWith($('#template-single').tmpl(toTemplateFormat(single, 1)).fadeIn(1000));
    entries[key] = single;
    changeOptionLabel('#target-single', single.members[0].name, key);
    for (var i = 0, len = singles.length; i < len; i++) {
      if (singles[i].key === key) {
        singles[i] = single;
        break;
      }
    }
    singleUpdated(single);
  });

  // エントリー（保存）
  $('#entry-button').on('click', function (e) {
    e.preventDefault();
    $('#edit-form').collapse('hide');
    enableActionButtons(false);
    hideMessages();

    // validate
    var isMediation = $('#type-single').prop('checked');
    if (!validate(isMediation)) {
      enableActionButtons(true);
      return false;
    }
    var data = getFormData();
    var dataRef;
    if (isMediation) {
      dataRef = singlesRef.push(data, onComplete);
    } else {
      dataRef = teamsRef.push(data, onComplete);
    }

    function onComplete() {
      $('#type-team').trigger('change');
      showMessage('success', 'エントリーが完了しました', true);
      $('.team-entry-form > .form-group').hide();
      setTimeout(function () {
        $('#team-entry').modal('hide');
      }, 1500);
      lastModifyEntryKey = dataRef.key;
    }
  });

  // 編集・削除の入力
  $('#input-button').on('click', function (e) {
    e.preventDefault();
    hideMessages();

    if ($('#target').prop('selectedIndex') === 0) {
      showMessage2('danger', '対象のエントリーを選択してください');
      return false;
    }
    if ($('#input-pass').val().length === 0) {
      showMessage2('danger', 'パスワードを入力してください');
      return false;
    }

    var key = $('#target').val();
    var password = md5($('#input-pass').val());
    var entry = entries[key];
    if (entry.password === password || config.adminPass === password) {
      // エントリー情報セット
      setFormData(entry, key);
      $('#message').hide();
      $('#entry-button').hide();
      $('#edit-button').show();
      $('#delete-button').show();
      $('#entry-form-title').text('エントリーの編集・削除');
      $('.entry-explain').hide();
      $('.pass .badge').hide();
      $('#pass').removeClass('require').prop('placeholder', 'パスワードを変更する');
      $('#team-entry').removeClass('edit');
      hideMessages();
    } else {
      showMessage2('danger', 'パスワードが違います');
      return false;
    }
  });

  // 編集する
  $('#edit-button').on('click', function (e) {
    e.preventDefault();

    enableActionButtons(false);
    hideMessages();

    // validate
    var key = $('#key').val();
    if (key.length === 0) {
      showMessage('danger', 'エラーが発生しました。もう一度最初からやり直してください');
      enableActionButtons(true);
      return false;
    }
    var isMediation = $('#type-single').prop('checked');
    if (!validate(isMediation, true)) {
      enableActionButtons(true);
      return false;
    }

    var data = getFormData();
    var dataRef;

    // パスワードの入力がなければ旧パスワードのまま
    var pass = $('#pass').val();
    if (pass.length !== 0) {
      data.password = md5(pass);
    } else {
      data.password = entries[key].password;
    }
    var dataRef;
    if (!entries[key].name && !isMediation) {
      // 斡旋からチームエントリー
      dataRef = singlesRef.child(key);
      dataRef.set(null);
      dataRef = teamsRef.push(data, onComplete);
    } else if (entries[key].name && isMediation) {
      // チームエントリーから斡旋
      dataRef = teamsRef.child(key);
      dataRef.set(null);
      dataRef = singlesRef.push(data, onComplete);
    } else if (isMediation) {
      // 斡旋から斡旋
      dataRef = singlesRef.child(key);
      dataRef.set(data, onComplete);
    } else {
      // チームエントリーからチームエントリー
      dataRef = teamsRef.child(key);
      dataRef.set(data, onComplete);
    }
    function onComplete() {
      showMessage('success', '編集が完了しました', true);
      $('.team-entry-form > .form-group').hide();
      setTimeout(function () {
        $('#team-entry').modal('hide');
      }, 1500);
      lastModifyEntryKey = dataRef.key;
    }
  });

  // 削除する
  $('#delete-button').on('click', function (e) {
    e.preventDefault();

    enableActionButtons(false);
    // validate
    var key = $('#key').val();
    if (key.length === 0) {
      showMessage('danger', 'エラーが発生しました。もう一度最初からやり直してください');
      enableActionButtons(true);
      return false;
    }
    comfirmDelete(function (e) {
      e.preventDefault();
      var isMediation = $('#type-single').prop('checked');
      var dataRef;
      if (isMediation) {
        dataRef = singlesRef.child(key);
        dataRef.set(null, onComplete);
      } else {
        dataRef = teamsRef.child(key);
        dataRef.set(null, onComplete);
      }
    });

    function onComplete() {
      showMessage('success', '削除が完了しました', true);
      $('.team-entry-form > .form-group').hide();
      setTimeout(function () {
        $('#team-entry').modal('hide');
      }, 1500);
    }
  });

  // スムーズスクロール
  $('.anchor-button').on('click', function (e) {
    e.preventDefault();
    var href = '#' + this.href.replace(/.*#/, '');
    scrollTo(href, -70);
  });

  function hideMessages() {
    $('#message').hide();
    $('#message2').hide();
  }

  function changeForm(type) {
    if (type === 'single') {
      $('#member1').show();
      $('#member1 > legend').hide();
      $('#member2').hide();
      $('#member3').hide();
      $('#team-name').hide();
      $('.pass').show();
    } else {
      $('#member1').show();
      $('#member1 > legend').show();
      $('#member2').show();
      $('#member3').show();
      $('#team-name').show();
      $('.pass').show();
    }
  }

  function enableActionButtons(enabled) {
    $('#entry-button').prop('disabled', !enabled);
    $('#edit-button').prop('disabled', !enabled);
    $('#delete-button').prop('disabled', !enabled);
    $('#cancel-button').prop('disabled', !enabled);
  }

  function validate(isMediation, isEdit) {
    if (typeof isEdit == 'undefined') {
      isEdit = false;
    }
    if (!isMediation) {
      if ($('#teamName').val().length === 0) {
        showMessage('danger', 'チーム名を入力してください');
        return false;
      }
    }
    if ($('#member1-name').val().length === 0) {
      showMessage('danger', '1人目のプレイヤー名を入力してください');
      return false;
    }
    if ($('#member1-character').prop('selectedIndex') === 0) {
      showMessage('danger', '1人目の使用キャラを選択してください');
      return false;
    }
    if (!isMediation) {
      for (var _i = 1; _i < TEAM_MEMBER_COUNT; _i++) {
        var num = _i + 1;
        if ($('#member' + num + '-name').val() || $('#member' + num + '-character').prop('selectedIndex') !== 0 || $('#member' + num + '-comment').val() || $('#member' + num + '-join-ok').prop('checked') || $('#member' + num + '-join-ng').prop('checked')) {
          if ($('#member' + num + '-name').val().length === 0) {
            showMessage('danger', num + '\u4EBA\u76EE\u306E\u30D7\u30EC\u30A4\u30E4\u30FC\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
            return false;
          }
          if ($('#member' + num + '-character').prop('selectedIndex') === 0) {
            showMessage('danger', num + '\u4EBA\u76EE\u306E\u4F7F\u7528\u30AD\u30E3\u30E9\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044');
            return false;
          }
        }
      }
    }
    if (!isEdit && $('#pass').val().length === 0) {
      showMessage('danger', '削除・編集用のパスワードを入力してください');
      return false;
    }
    return true;
  }

  function getFormData() {
    // must inputs
    var data = {
      updatedAt: new Date().toString(),
      password: md5($('#pass').val()),
      members: []
    };

    for (var _i2 = 0; _i2 < TEAM_MEMBER_COUNT; _i2++) {
      var num = _i2 + 1;
      if ($('#member' + num + '-name').val()) {
        data.members.push({
          name: $('#member' + num + '-name').val(),
          character: $('#member' + num + '-character').val(),
          twitter: $('#member' + num + '-twitter').val(),
          comment: $('#member' + num + '-comment').val().replace(/[\n\r]/g, '')
        });
      }
    }

    if ($('#type-team').prop('checked')) {
      // チーム名
      data.name = $('#teamName').val();
    }
    return data;
  }

  function setFormData(entry, key) {
    $('#key').val(key || '');

    for (var _i3 = 0; _i3 < entry.members.length; _i3++) {
      var num = _i3 + 1;
      $('#member' + num + '-name').val(entry.members[_i3].name);
      $('#member' + num + '-character').val(entry.members[_i3].character || '選択してください');
      $('#member' + num + '-twitter').val(entry.members[_i3].twitter);
      $('#member' + num + '-comment').val(entry.members[_i3].comment);
      // let after = entry.members[i].after;
      // if (after) {
      //   if (after == 1) {
      //     $(`#member${num}-join-ok`).prop('checked', true);
      //   } else {
      //     $(`#member${num}-join-ng`).prop('checked', true);
      //   }
      // }
    }

    if (entry.name && entry.name.length !== 0) {
      $('#type-team').prop('checked', true).trigger('change');
      $('#teamName').val(entry.name);
    } else {
      $('#type-single').prop('checked', true).trigger('change');
    }
  }

  function addOption(selector, label, value, reverse) {
    if (reverse) {
      $(selector).prepend($('<option/>').text(label).val(value));
    } else {
      $(selector).append($('<option/>').text(label).val(value));
    }
  }

  function removeOption(selector, value) {
    $(selector).find('option').each(function (i, option) {
      if (option.value === value) {
        $(option).remove();
        return;
      }
    });
  }
  function changeOptionLabel(selector, label, value) {
    $(selector).find('option').each(function (i, option) {
      if (option.value === value) {
        $(option).text(label);
        return;
      }
    });
  }

  function showMessage(type, message, fadeOut) {
    $('#message').empty();
    // if (typeof fadeOut === 'undefined') {
    //   fadeOut = false;
    // }
    $('#message')[0].className = '';
    $('#message').text(message).addClass('alert alert-' + type).show();
    // if (fadeOut) {
    //   setTimeout(function(){
    //     $('#message').fadeOut(1000);
    //   }, 3000);
    // }
  }

  function showMessage2(type, message, fadeOut) {
    $('#message2').empty();
    // if (typeof fadeOut === 'undefined') {
    //   fadeOut = false;
    // }
    $('#message2')[0].className = '';
    $('#message2').text(message).addClass('alert alert-' + type).show();
    // if (fadeOut) {
    //   setTimeout(function(){
    //     $('#message2').fadeOut(1000);
    //   }, 3000);
    // }
  }

  function comfirmDelete(handle) {
    $('#message').empty();
    var div = $('<div/>');
    var span = $('<span/>').text('エントリーを削除します。よろしいですか？');
    var button = $('<a href="#"/>').addClass('btn btn-danger btn-sm').text('はい').on('click', handle);
    var cancel = $('<a href="#"/>').addClass('btn btn-default btn-sm').text('いいえ').on('click', function (e) {
      e.preventDefault();
      $('#message').hide();
    });
    div.append(span);
    div.append(button);
    div.append(cancel);
    $('#message')[0].className = '';
    $('#message').append(div).addClass('alert alert-danger').show();
  }

  function scrollTo(selector, adjust) {
    $("html,body").animate({ scrollTop: $(selector).eq(0).offset().top + adjust });
  }

  $('.to-edit-form').on('click', function (e) {
    e.preventDefault();
    $('#team-entry').addClass('edit').modal();
  });
  $('.to-entry-form').on('click', function (e) {
    e.preventDefault();
    $('#team-entry').removeClass('edit').modal();
  });
  $(document).on('click', '.edit-link', function (e) {
    e.preventDefault();
    $('#target').val($(this).data('id'));
    $('#team-entry').addClass('edit').modal();
  });
  $('#team-entry').on('shown.bs.modal', function (e) {
    if ($('#team-entry').hasClass('edit')) {
      if ($('#target').prop('selectedIndex') !== 0) {
        $('#input-pass').focus();
      } else {
        $('#target').focus();
      }
    }
  });
  $('#team-entry').on('hidden.bs.modal', function (e) {
    $('#entry-form-title').text('エントリー');
    $('#entry-button')[0].style.cssText = '';
    $('.entry-explain')[0].style.cssText = '';
    $('#edit-button')[0].style.cssText = '';
    $('#delete-button')[0].style.cssText = '';
    $('.pass .badge')[0].style.cssText = '';
    $('#pass').addClass('require').prop('placeholder', '');
    $('.team-entry-form')[0].reset();
    $('.team-entry-form > .form-group')[0].style.cssText = '';
    $('.edit-form')[0].reset();
    changeForm();
    enableActionButtons(true);
    hideMessages();

    if (lastModifyEntryKey) {
      var selector = '#' + lastModifyEntryKey;
      scrollTo(selector, -100);
      $(selector).addClass('done');
      setTimeout(function () {
        $(selector).addClass('animate');
      }, 100);
      lastModifyEntryKey = '';
    }
  });
  $('.change-edit-form').on('click', function (e) {
    e.preventDefault();
    $('#team-entry').addClass('edit');
    hideMessages();
  });

  // modalが表示された時
  $(".modal").on("shown.bs.modal", function () {
    var urlReplace = "#" + $(this).attr('id');
    history.pushState(null, null, urlReplace);
  });

  // modalの閉じる機能が動作した時
  $(".modal").on("hidden.bs.modal", function () {
    if (location.hash == "#" + $(this).attr('id')) {
      history.back();
    }
  });

  function teamUpdated(team) {
    $('.team-entry-count').text(teams.length);
    updateTotalCount();
    if (team) {
      if (team.updatedAt) {
        $('.team-last-updated-at').text(getDateString(team.updatedAt));
      }
    } else {
      $('.team-last-updated-at').text(getDateString());
    }
    analytics();
  }
  function singleUpdated(single) {
    $('.single-entry-count').text(singles.length);
    updateTotalCount();
    if (single) {
      if (single.updatedAt) {
        $('.single-last-updated-at').text(getDateString(single.updatedAt));
      }
    } else {
      $('.single-last-updated-at').text(getDateString());
    }
    analytics();
  }
  var upCountTask;
  function updateTotalCount() {
    var totalCount = 0;
    teams.forEach(function (team) {
      team.members.forEach(function (member) {
        if (member.name) {
          totalCount++;
        }
      });
    });
    singles.forEach(function (team) {
      team.members.forEach(function (member) {
        if (member.name) {
          totalCount++;
        }
      });
    });
    $('.total-count').text(totalCount);

    // if (upCountTask) {
    //   clearTimeout(upCountTask);
    // }
    // upCountTask = setTimeout(function() {
    //   var afterCount = 0;
    //   for (var key in entries) {
    //     var entry = entries[key];
    //     for (var i = 0, len = entry.members.length; i < len; i++) {
    //       var member = entry.members[i];
    //       if (member.after == 1) {
    //         afterCount++;
    //       }
    //     }
    //   }
    //   $('.after-count').text(afterCount);
    // }, 1000);
  }

  $('.clear-button').click(function (e) {
    e.preventDefault();
    var num = $(e.target).attr('data-target');
    clearFormPlayer(num);
  });

  function clearFormPlayer(num) {
    if (!num) {
      return;
    }
    $('#member' + num + '-name').val('');
    $('#member' + num + '-character')[0].selectedIndex = 0;
    $('#member' + num + '-comment').val('');
    $('#member' + num + '-join-ok').prop('checked', false);
    $('#member' + num + '-join-ng').prop('checked', false);
    $('#member' + num + '-twitter').val('');
  }

  var task;
  function analytics() {
    if (task) {
      clearTimeout(task);
    }
    task = setTimeout(function () {
      var pCharas = $.extend(true, {}, charas);
      for (var key in entries) {
        var entry = entries[key];
        for (var i = 0, len = entry.members.length; i < len; i++) {
          if (pCharas[entry.members[i].character]) {
            pCharas[entry.members[i].character].count++;
          }
        }
      }
      var pCharasArray = sortByCount(objectToArray(pCharas));
      displayCharaCount(pCharasArray, '#character-count');
    }, 1000);
  }
  function objectToArray(object) {
    var array = [];
    for (var key in object) {
      array.push(object[key]);
    }
    return array;
  }
  function sortByCount(array) {
    return array.sort(function (a, b) {
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      return 0;
    });
  }
  function displayCharaCount(array, selecter, totalSelecter) {
    $(selecter).empty();
    var totalCount = 0;
    for (var i = array.length - 1; i >= 0; i--) {
      var chara = array[i];
      $('#character-count-template').tmpl(chara).appendTo(selecter);
      totalCount += chara.count;
    }
    if (totalSelecter) {
      $(totalSelecter).text(totalCount);
    }
  }

  function getDateString(date) {
    if (date === undefined) {
      date = new Date();
    } else if (typeof date === 'string' && date.length !== 0) {
      date = new Date(date);
    }
    if (date) {
      return date.getFullYear() + '/' + padLeft(date.getMonth() + 1) + '/' + padLeft(date.getDate()) + ' ' + padLeft(date.getHours()) + ':' + padLeft(date.getMinutes()) + ':' + padLeft(date.getSeconds());
    } else {
      return '';
    }
  }
  function padLeft(str, len, pad) {
    if (pad === undefined) {
      pad = '0';
    }
    if (len === undefined) {
      len = 2;
    }
    var buf = '';
    for (var i = 0; i < len; i++) {
      buf += pad;
    }
    str = pad + str;
    return str.slice(-len);
  }

  var charaBlank = {
    name: '',
    image: 'blank.png'
  };

  function toTemplateFormat(data, len) {
    if (!len) {
      len = TEAM_MEMBER_COUNT;
    }
    for (var _i4 = 0; _i4 < len; _i4++) {
      var member = data.members[_i4];
      if (!member) {
        member = {};
      }
      member.name = member.name || '';
      member.comment = member.comment || '';
      var _character = charas[member.character];
      if (!_character) {
        _character = charaBlank;
      }
      // member.after = member.after;
      member.charaName = _character.name;
      member.charaIcon = _character.image;
      data.members[_i4] = member;
    }
    return data;
  }

  analytics();
});
//# sourceMappingURL=main.js.map
