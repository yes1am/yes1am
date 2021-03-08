{{@ baseREADME }}

<details>
  <summary>
    <strong>👆 👉 GitHub repositories. 👇<strong> ({{myReposTotal}})
		&nbsp;Update At {{date}} 
  </summary>
  <br>

| repository | description | stars |
| --- | --- | --- |{{each repos}}
| [{{ $value.name }}]({{ $value.url }}) | {{ $value.description }} | {{ $value.stargazerCount }} |{{/each}}
</details>

<details>
  <summary>
    <strong>👆 👉 What I Star. 👇<strong> ({{myStarsTotal}})
  </summary>
  <br>

| repository  |
| --- | {{each myStarsRepos}}
| [{{ $value.owner.login }}]({{ $value.owner.url }})/[{{ $value.name }}]({{ $value.url }}): {{ $value.description }} |{{/each}}
</details>

<details>
  <summary>
    <strong>👆 👉 Who I Follow. 👇<strong> ({{myFollowingTotal}})
  </summary>
  <br>

| Following  |
| --- | {{each myFollowingUsers}}
| [{{ $value.login }}]({{ $value.url }})<ul>{{each $value.itemShowcase.items.nodes}}<li>[{{ $value.name}}]({{ $value.url }}): {{$value.description}}</li>{{/each}}<ul>|{{/each}}</details>

