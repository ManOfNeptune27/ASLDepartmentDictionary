<script>
    let showDropdown1 = false;
    let showDropdown2 = false;

    function toggleDropdown1() {
        showDropdown1 = !showDropdown1;
    }

    function toggleDropdown2() {
        showDropdown2 = !showDropdown2;
    }



</script>


<h1 class="text-center my-4">ASL Dictionary</h1>

<div class="container text-center">
  <div class="d-flex flex-column align-items-center gap-3">

    <div class="dropdown">
      <button class="btn btn-primary dropdown-toggle" on:click={toggleDropdown1}>
        Spread the Sign
      </button>
      {#if showDropdown1}
        <div class="dropdown-menu show position-static mt-2">
          <button class="dropdown-item" on:click={() => alert('Option 1 Clicked')}>Option 1</button>
          <button class="dropdown-item" on:click={() => alert('Option 2 Clicked')}>Option 2</button>
          <button class="dropdown-item" on:click={() => alert('Option 3 Clicked')}>Option 3</button>
        </div>
      {/if}
    </div>

    <div class="dropdown">
      <button class="btn btn-primary dropdown-toggle" on:click={toggleDropdown2}>
        TRUE WAY ASL
      </button>
      {#if showDropdown2}
        <div class="dropdown-menu show position-static mt-2">
          <button class="dropdown-item" on:click={() => alert('Option 1 Clicked')}>Option 1</button>
          <button class="dropdown-item" on:click={() => alert('Option 2 Clicked')}>Option 2</button>
          <button class="dropdown-item" on:click={() => alert('Option 3 Clicked')}>Option 3</button>
        </div>
      {/if}
    </div>

  </div>
</div>
