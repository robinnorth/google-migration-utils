# Google Migration Utils

> CLI utilities to assist with migrating Google Account data where no Google-provided solution exists

## Installation

```shell
$ yarn
```

or

```shell
$ npm i
```

## Usage

```shell
$ yarn cli <service> <action> [--help]
```

### Google Maps

#### Import saved places

Based off a [gist](https://gist.github.com/benjibee/37e0031a8aa7a25e9814a01bdb03217c) by [@benjibee]

```shell
$ yarn cli maps import-places --help

Imports places to Google Maps from saved places GeoJSON or CSV data files that w
ere exported by Google Takeout

Options:
      --version     Show version number                                [boolean]
      --help        Show help                                          [boolean]
  -f, --file        Path to a file containing Google Maps places data in GeoJSON
                     or a Google Maps places list in CSV format         [string]
  -l, --list        Name of the list you want to import to
                [string] [choices: "Favorites", "WantToGo", "Starred", "Custom"]
  -c, --customList  Index of the custom list you want to import to      [number]
```

[@benjibee]: https://github.com/benjibee
