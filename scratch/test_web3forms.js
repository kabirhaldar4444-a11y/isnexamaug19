async function testWeb3Forms() {
  const accessKey = "751bb031-31ee-44f1-af57-9e1731da45da";
  const email = "info@isuccessnode.com";

  console.log("Testing Web3Forms API with Access Key:", accessKey);

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "Test KYC Submission",
        from_name: "iSuccessNode Test",
        email: "test-sender@isuccessnode.com",
        message: "This is a diagnostic test submission."
      })
    });

    console.log("HTTP Status:", res.status);
    const text = await res.text();
    console.log("Response Raw Text:\n", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testWeb3Forms();
