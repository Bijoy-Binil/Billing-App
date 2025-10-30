from weasyprint import HTML

HTML(string="""
<h1 style='color: #10B981;'>Invoice Test</h1>
<p>This is a test PDF generated with WeasyPrint.</p>
""").write_pdf("invoice_test.pdf")

print("✅ PDF generated successfully: invoice_test.pdf")
