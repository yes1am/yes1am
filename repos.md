{{@ stat }}

<details>
  <summary>
    <strong>👆 👉 GitHub repositories. 👇<strong>
		&nbsp;<span style="color:#6a737d; font-size:12px;">Update At {{date}}</span>
  </summary>
  <br>

| repositorie | description | stars |
| --- | --- | --- |{{each repos}}
| [{{ $value.name }}]({{ $value.link }}) | {{ $value.description }} | {{ $value.star }} |{{/each}}
</details>