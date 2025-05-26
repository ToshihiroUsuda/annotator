import { IAppStrings } from "../strings";

/**
 * 日本語のアプリケーション文字列
 */
export const japanese: IAppStrings = {
  appName: "ビジュアルオブジェクトタグ付けツール",
  common: {
    displayName: "表示名",
    description: "説明",
    submit: "送信",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    provider: "プロバイダー",
    homePage: "ホームページ",
  },
  titleBar: {
    help: "ヘルプ",
    minimize: "最小化",
    maximize: "最大化",
    restore: "元に戻す",
    close: "閉じる",
  },
  homePage: {
    newProject: "新規プロジェクト",
    openLocalProject: {
      title: "ローカルプロジェクトを開く",
    },
    recentProjects: "最近のプロジェクト",
    deleteProject: {
      title: "プロジェクトの削除",
      confirmation: "プロジェクトを削除してもよろしいですか？",
    },
    clearProject: {
      title: "プロジェクトのクリア",
      confirmation: "プロジェクトをクリアしてもよろしいですか？",
    },
    importProject: {
      title: "プロジェクトのインポート",
      confirmation: "プロジェクトをインポートしてもよろしいですか？",
    },
    messages: {
      deleteSuccess: "${project.name}を正常に削除しました",
    },
    selectDirectory: "ディレクトリを選択",
    selectFile: "ファイルを選択",
    chooseDirectory: "ディレクトリを選択",
  },
  appSettings: {
    title: "アプリケーション設定",
    storageTitle: "ストレージ設定",
    uiHelp: "設定の保存場所",
    save: "設定を保存",
    securityToken: {
      name: {
        title: "名前",
      },
      key: {
        title: "キー",
      },
    },
    securityTokens: {
      title: "セキュリティトークン",
      description:
        "セキュリティトークンはプロジェクト設定内の機密データを暗号化するために使用されます",
    },
    version: {
      description: "バージョン：",
    },
    commit: "コミットSHA",
    devTools: {
      description: "問題の診断に役立つアプリケーション開発者ツールを開く",
      button: "開発者ツールの切り替え",
    },
    reload: {
      description: "現在の変更を破棄してアプリケーションを再読み込み",
      button: "アプリケーションを更新",
    },
    messages: {
      saveSuccess: "アプリケーション設定を正常に保存しました",
    },
    rootDirectory: "ルートディレクトリ",
  },
  projectSettings: {
    title: "プロジェクト設定",
    securityToken: {
      title: "セキュリティトークン",
      description:
        "プロジェクトファイル内の機密データを暗号化するために使用されます",
    },
    save: "プロジェクトを保存",
    sourcePath: "ディレクトリ名",
    videoSettings: {
      title: "動画設定",
      description: "タグ付けのためにフレームを抽出するレート",
      frameExtractionRate: "フレーム抽出レート（1秒あたりのフレーム数）",
    },
    addConnection: "接続を追加",
    messages: {
      saveSuccess: "${project.name}のプロジェクト設定を正常に保存しました",
    },
  },
  projectMetrics: {
    title: "プロジェクトメトリクス",
    assetsSectionTitle: "アセット",
    totalAssetCount: "アセット総数",
    visitedAssets: "訪問済みアセット（${count}）",
    taggedAssets: "タグ付け済みアセット（${count}）",
    nonTaggedAssets: "未タグ付けアセット（${count}）",
    nonVisitedAssets: "未訪問アセット（${count}）",
    tagsSectionTitle: "タグとラベル",
    totalRegionCount: "タグ付け済みリージョン総数",
    totalTagCount: "タグ総数",
    avgTagCountPerAsset: "アセットあたりの平均タグ数",
  },
  tags: {
    title: "タグ",
    placeholder: "新しいタグを追加",
    editor: "タグエディタ",
    modal: {
      name: "タグ名",
      color: "タグの色",
    },
    colors: {
      white: "白",
      gray: "グレー",
      red: "赤",
      maroon: "マルーン",
      yellow: "黄",
      olive: "オリーブ",
      lime: "ライム",
      green: "緑",
      aqua: "アクア",
      teal: "ティール",
      blue: "青",
      navy: "ネイビー",
      fuschia: "フクシア",
      purple: "紫",
    },
    warnings: {
      existingName: "タグ名が既に存在します。別の名前を選択してください",
      emptyName: "タグ名を空にすることはできません",
      unknownTagName: "不明",
    },
    toolbar: {
      add: "新しいタグを追加",
      search: "タグを検索",
      edit: "タグを編集",
      lock: "タグをロック",
      moveUp: "タグを上に移動",
      moveDown: "タグを下に移動",
      delete: "タグを削除",
    },
  },
  editorPage: {
    width: "幅",
    height: "高さ",
    tagged: "タグ付け済み",
    visited: "訪問済み",
    toolbar: {
      select: "選択",
      pan: "パン",
      drawRectangle: "矩形を描画",
      drawPolygon: "多角形を描画",
      copyRectangle: "矩形をコピー",
      trackRegions: "リージョンを追跡",
      interpolateRegions: "リージョンを補間",
      copy: "リージョンをコピー",
      cut: "リージョンを切り取り",
      paste: "リージョンを貼り付け",
      removeAllRegions: "すべてのリージョンを削除",
      previousAsset: "前のアセット",
      nextAsset: "次のアセット",
      zoomIn: "ズームイン",
      zoomOut: "ズームアウト",
      saveProject: "プロジェクトを保存",
      exportProject: "プロジェクトをエクスポート",
      activeLearning: "アクティブラーニング",
    },
    videoPlayer: {
      previousTaggedFrame: {
        tooltip: "前のキーフレーム",
      },
      nextTaggedFrame: {
        tooltip: "次のキーフレーム",
      },
      previousExpectedFrame: {
        tooltip: "前のフレーム",
      },
      nextExpectedFrame: {
        tooltip: "次のフレーム",
      },
      previous5ExpectedFrame: {
        tooltip: "5フレーム前",
      },
      next5ExpectedFrame: {
        tooltip: "5フレーム後",
      },
      previous30ExpectedFrame: {
        tooltip: "30フレーム前",
      },
      next30ExpectedFrame: {
        tooltip: "30フレーム後",
      },
    },
    help: {
      title: "ヘルプメニューの切り替え",
      escape: "ヘルプメニューを終了",
    },
    assetError: "アセットを読み込めません",
    tags: {
      hotKey: {
        apply: "ホットキーでタグを適用",
        lock: "ホットキーでタグをロック",
      },
      rename: {
        title: "タグの名前変更",
        confirmation:
          "このタグの名前を変更してもよろしいですか？すべてのアセットで名前が変更されます",
      },
      delete: {
        title: "タグの削除",
        confirmation:
          "このタグを削除してもよろしいですか？すべてのアセットから削除され、このタグのみが付いているリージョンも削除されます",
      },
    },
    canvas: {
      removeAllRegions: {
        title: "すべてのリージョンを削除",
        confirmation: "すべてのリージョンを削除してもよろしいですか？",
      },
      interpolation: {
        title: "リージョンを補間",
        confirmation: "リージョンを補間してもよろしいですか？",
      },
      untaggedRegion: {
        title: "未タグ付けのリージョンがあります",
        confirmation:
          "未タグ付けのリージョンがあります。これらを削除したい場合は、「はい」を押してください。",
      },
      missedFrameLabel: {
        title: "フレームラベル情報がありません",
        confirmation: "フレームラベル情報が入力されていません。入力しますか？",
      },
    },
    messages: {
      enforceTaggedRegions: {
        title: "無効なリージョンが検出されました",
        description:
          "1つ以上のリージョンにタグが付いていません。次のアセットに進む前に、すべてのリージョンにタグを付けてください。",
      },
    },
  },
  export: {
    title: "エクスポート",
    settings: "エクスポート設定",
    saveSettings: "エクスポート設定を保存",
    providers: {
      common: {
        properties: {
          assetState: {
            title: "アセットの状態",
            description: "エクスポートに含めるアセット",
            options: {
              all: "すべてのアセット",
              visited: "訪問済みのアセットのみ",
              tagged: "タグ付け済みのアセットのみ",
            },
          },
          testTrainSplit: {
            title: "テスト/トレーニング分割",
            description: "エクスポートデータに使用するテスト/トレーニング分割",
          },
          includeImages: {
            title: "画像を含める",
            description: "ターゲット接続にバイナリ画像アセットを含めるかどうか",
          },
        },
      },
      vottJson: {
        displayName: "VoTT JSON",
      },
      azureCV: {
        displayName: "Azure Custom Vision Service",
        regions: {
          australiaEast: "オーストラリア東部",
          centralIndia: "インド中部",
          eastUs: "米国東部",
          eastUs2: "米国東部2",
          japanEast: "東日本",
          northCentralUs: "米国中北部",
          northEurope: "北ヨーロッパ",
          southCentralUs: "米国中南部",
          southeastAsia: "東南アジア",
          ukSouth: "英国南部",
          westUs2: "米国西部2",
          westEurope: "西ヨーロッパ",
        },
        properties: {
          apiKey: {
            title: "APIキー",
          },
          region: {
            title: "リージョン",
            description: "サービスがデプロイされているAzureリージョン",
          },
          classificationType: {
            title: "分類タイプ",
            options: {
              multiLabel: "画像ごとに複数のタグ",
              multiClass: "画像ごとに1つのタグ",
            },
          },
          name: {
            title: "プロジェクト名",
          },
          description: {
            title: "プロジェクトの説明",
          },
          domainId: {
            title: "ドメイン",
          },
          newOrExisting: {
            title: "新規または既存のプロジェクト",
            options: {
              new: "新規プロジェクト",
              existing: "既存のプロジェクト",
            },
          },
          projectId: {
            title: "プロジェクト名",
          },
          projectType: {
            title: "プロジェクトタイプ",
            options: {
              classification: "分類",
              objectDetection: "物体検出",
            },
          },
        },
      },
      tfRecords: {
        displayName: "Tensorflow Records",
      },
      pascalVoc: {
        displayName: "Pascal VOC",
        exportUnassigned: {
          title: "未割り当てをエクスポート",
          description: "エクスポートデータに未割り当てのタグを含めるかどうか",
        },
      },
      cntk: {
        displayName: "Microsoft Cognitive Toolkit (CNTK)",
      },
      csv: {
        displayName: "カンマ区切り値 (CSV)",
      },
    },
    messages: {
      saveSuccess: "エクスポート設定を正常に保存しました",
    },
  },
  activeLearning: {
    title: "アクティブラーニング",
    form: {
      properties: {
        modelPathType: {
          title: "モデルプロバイダー",
          description: "トレーニングモデルの読み込み元",
          options: {
            preTrained: "事前トレーニング済みCoco SSD",
            customFilePath: "カスタム（ファイルパス）",
            customWebUrl: "カスタム（URL）",
          },
        },
        autoDetect: {
          title: "自動検出",
          description: "アセット間を移動する際に自動的に予測を行うかどうか",
        },
        modelPath: {
          title: "モデルパス",
          description: "ローカルファイルシステムからモデルを選択",
        },
        modelUrl: {
          title: "モデルURL",
          description: "公開Web URLからモデルを読み込み",
        },
        predictTag: {
          title: "タグを予測",
          description: "予測に自動的にタグを含めるかどうか",
        },
      },
    },
    messages: {
      loadingModel: "アクティブラーニングモデルを読み込み中...",
      errorLoadModel: "アクティブラーニングモデルの読み込みエラー",
      saveSuccess: "アクティブラーニング設定を正常に保存しました",
    },
  },
  profile: {
    settings: "プロフィール設定",
  },
  errors: {
    unknown: {
      title: "不明なエラー",
      message:
        "アプリケーションで不明なエラーが発生しました。もう一度お試しください。",
    },
    projectUploadError: {
      title: "ファイルのアップロードエラー",
      message:
        "ファイルのアップロード中にエラーが発生しました。ファイルの形式が正しいことを確認して、もう一度お試しください。",
    },
    genericRenderError: {
      title: "アプリケーションの読み込みエラー",
      message:
        "アプリケーションのレンダリング中にエラーが発生しました。もう一度お試しください。",
    },
    projectInvalidJson: {
      title: "プロジェクトファイルの解析エラー",
      message:
        "選択されたプロジェクトファイルに有効なJSONが含まれていません。ファイルを確認して、もう一度お試しください。",
    },
    projectDeleteError: {
      title: "プロジェクトの削除エラー",
      message:
        "プロジェクトの削除中にエラーが発生しました。プロジェクトファイルとセキュリティトークンが存在することを確認して、もう一度お試しください。",
    },
    canvasError: {
      title: "キャンバスの読み込みエラー",
      message:
        "キャンバスの読み込み中にエラーが発生しました。プロジェクトのアセットを確認して、もう一度お試しください。",
    },
    exportFormatNotFound: {
      title: "プロジェクトのエクスポートエラー",
      message:
        "プロジェクトにエクスポート形式が設定されていません。エクスポート設定ページでエクスポート形式を選択してください。",
    },
    activeLearningPredictionError: {
      title: "アクティブラーニングエラー",
      message:
        "現在のアセットでリージョンの予測中にエラーが発生しました。アクティブラーニングの設定を確認して、もう一度お試しください。",
    },
    projectImportError: {
      title: "プロジェクトのインポートエラー",
      message:
        "プロジェクトのインポート中にエラーが発生しました。プロジェクトファイルを確認して、もう一度お試しください。",
    },
    assetImportError: {
      title: "アセットのインポートエラー",
      message:
        "アセットのインポート中にエラーが発生しました。アセットファイルを確認して、もう一度お試しください。",
    },
    assetExportError: {
      title: "アセットのエクスポートエラー",
      message:
        "アセットのエクスポート中にエラーが発生しました。エクスポート設定を確認して、もう一度お試しください。",
    },
    pasteRegionTooBigError: {
      title: "リージョンの貼り付けエラー",
      message:
        "貼り付けようとしているリージョンが現在のアセットに対して大きすぎます。より大きなアセットに貼り付けてください。",
    },
    overloadedKeyBinding: {
      title: "キーボードショートカットの競合",
      message:
        "このキーボードショートカットは既に別のアクションに割り当てられています。別のショートカットを選択してください。",
    },
    formSchemaImportError: {
      title: "フォームスキーマのインポートエラー",
      message:
        "フォームスキーマのインポート中にエラーが発生しました。スキーマファイルを確認して、もう一度お試しください。",
    },
    databaseJsonNotFoundError: {
      title: "データベース設定エラー",
      message:
        "データベース設定ファイルが見つかりませんでした。データベース設定を確認して、もう一度お試しください。",
    },
  },
};
