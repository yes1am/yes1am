{{@ stat }}

<details>
  <summary>
    <strong>👆 👉 GitHub repositories. 👇<strong>
		&nbsp;Update At {{date}}
  </summary>
  <br>

| repository | description | stars |
| --- | --- | --- |{{each repos}}
| [{{ $value.name }}]({{ $value.link }}) | {{ $value.description }} | {{ $value.star }} |{{/each}}
</details>

<details>
  <summary>
    <strong>👆 👉 What I Star. 👇<strong>
  </summary>
  <br>

| repository  |
| --- | {{each stars}}
| [{{ $value.repoName }}]({{ $value.link }}): {{ $value.description }} |{{/each}}
</details>

<details>
  <summary>
    <strong>👆 👉 Who I Follow. 👇<strong>
  </summary>
  <br>

| Following  |
| --- | {{each follows}}
| [{{ $value.userName }}](https://github.com{{ $value.link }})<ul>{{each $value.pinnedRepos.repos}}<li>[{{ $value.title}}](https://github.com{{ $value.link }}): {{$value.desc}}</li>{{/each}}<ul>|{{/each}}</details>

